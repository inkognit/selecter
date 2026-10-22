# Архитектура БД

Версия 1 от 22.10.2026. PostgreSQL 16, схема и миграции — Prisma 7.10.1.

| Файл                                                    | Что в нём                                         |
| ------------------------------------------------------- | ------------------------------------------------- |
| `backend/prisma/schema.prisma`                          | модель для Prisma Client                          |
| `backend/prisma/migrations/20261022000100_init_tasks/`  | первая миграция: таблицы + ограничения            |
| `backend/prisma/initial.sql`                            | демо-данные (только данные, не схема)             |
| `backend/prisma.config.ts`                              | пути Prisma и чтение `DATABASE_URL` из корневого `.env` |
| `docker-compose.yml`                                    | PostgreSQL на порту 3510                          |
| `.vscode/tasks.json`                                    | `stack: prepare` = install → up → migrate → seed  |

## 1. Таблицы

### `tasks`

| Колонка       | Тип              | Ограничения                                         |
| ------------- | ---------------- | --------------------------------------------------- |
| `id`          | `uuid`           | PK, `DEFAULT gen_random_uuid()`                     |
| `title`       | `varchar(200)`   | `NOT NULL`, `CHECK (char_length(btrim(title)) BETWEEN 1 AND 200)` |
| `description` | `text`           | `NULL` или ≤ 5000 символов (`CHECK`)                |
| `status`      | `task_status`    | `NOT NULL DEFAULT 'NEW'`                            |
| `priority`    | `task_priority`  | `NOT NULL DEFAULT 'MEDIUM'`                         |
| `position`    | `integer`        | `NOT NULL`, `CHECK (position >= 0)`                 |
| `created_at`  | `timestamptz(3)` | `NOT NULL DEFAULT now()`                            |
| `updated_at`  | `timestamptz(3)` | `NOT NULL`, ставит Prisma (`@updatedAt`)            |

`UNIQUE (status, position) DEFERRABLE INITIALLY DEFERRED` — одна позиция в колонке
занята одной задачей. Индекс этого ограничения обслуживает и выборку доски
`ORDER BY status, position`, отдельный индекс не нужен.

Перечисления: `task_status` = `NEW`, `IN_PROGRESS`, `DONE`;
`task_priority` = `LOW`, `MEDIUM`, `HIGH`.

### `seed_history`

| Колонка      | Тип              | Ограничения          |
| ------------ | ---------------- | -------------------- |
| `name`       | `varchar(100)`   | PK                   |
| `applied_at` | `timestamptz(3)` | `NOT NULL DEFAULT now()` |

Отметки применённых наборов начальных данных. Без неё `initial.sql`, который запускается
при каждом старте из Debug, возвращал бы удалённые пользователем демо-задачи — это
нарушало бы Ф-7 (данные сохраняются) и не давало бы увидеть пустую доску (Ф-8).

## 2. Почему так

- **`position` — плотный целочисленный индекс (0, 1, 2…), а не дробный ранг.** Задач на
  доске сотни, переиндексация колонки — один `UPDATE` на десятки строк. Зато позиции
  читаются глазами, правила перестановки — простая чистая функция, тестируемая без БД.
- **UNIQUE отложенный.** PostgreSQL проверяет обычный UNIQUE на каждой строке, поэтому сдвиг
  колонки `position = position + 1` падает на промежуточном дубле. С `INITIALLY DEFERRED`
  проверка идёт на `COMMIT`, когда позиции уже согласованы. Проверено на живой базе.
- **Ограничения в БД, а не только в DTO** (правило gonets «код может врать, констрейнт —
  нет»). Валидация на входе даёт понятную ошибку, ограничение — последний рубеж.
- **UUID генерирует база** (`gen_random_uuid()`): запись, вставленная мимо Prisma (сид,
  ручной SQL), получает id так же.

## 3. Инварианты и как их держит код (контракт для этапа 4)

| Инвариант                                 | Где держится                                   | SQLSTATE → код API                         |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| название 1–200 символов после обрезки     | DTO + `tasks_title_length_check` + `varchar(200)` | `23514`, `22001` → `validation_failed` 422 |
| описание ≤ 5000                           | DTO + `tasks_description_length_check`         | `23514` → `validation_failed` 422          |
| позиция ≥ 0                               | домен (приведение позиции) + `tasks_position_check` | `23514` → `validation_failed` 422     |
| позиции в колонке уникальны               | транзакция репозитория + `tasks_status_position_key` | `23505` → `task_conflict` 409       |
| позиции в колонке без дыр                 | репозиторий переиндексирует колонку при create / move / delete | — (ограничением не выражается) |

Все записи, меняющие позиции (создание, перенос, удаление), выполняются в одной транзакции
и начинаются с `pg_advisory_xact_lock` на доску: доска одна, записи редкие, сериализация
дешевле, чем разбор гонок. Тогда `23505` возможен только при ошибке в коде — и всё равно
отдаётся как 409, а не 500 (правило gonets №3: инвариант в БД = catch на его SQLSTATE).

## 4. Развёртывание

1. `docker compose up -d --wait` — PostgreSQL 16 healthy на `localhost:3510`.
2. `npm run db:migrate` (`prisma migrate deploy`) — применяет миграции из репозитория.
3. `npm run db:seed` (`prisma db execute --file prisma/initial.sql`) — демо-данные один раз.

Всё это — задача VS Code `stack: prepare`. Повторный запуск безопасен: миграции уже
применены, сид пропускается по отметке. `infra: reset (стирает данные)` удаляет том
базы — следующий запуск поднимет чистую базу с демо-доской.

## 5. Как добавить миграцию

1. Изменить `schema.prisma`.
2. `npx prisma migrate dev --create-only --name <имя>` — Prisma только создаёт SQL.
3. Прочитать SQL. Prisma не знает, что `tasks_status_position_key` — `DEFERRABLE`
   ограничение, а не индекс: если в миграции появилось что-то про него — убрать.
   `CHECK` Prisma не видит и не трогает.
4. Новый статус: значение в `enum TaskStatus` → миграция `ALTER TYPE task_status ADD VALUE`
   → подпись колонки на фронте.
5. Проверка, что схема и база совпадают (ожидаемо «empty migration»):
   `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`.

## 6. Проверено на живой базе (22.10.2026)

- Миграция применяется на пустую базу; сид, запущенный дважды, даёт 6 задач без дублей.
- Отклоняются: название из пробелов, 201 символ, описание 5001 символ, позиция −1,
  дубль позиции (`23505`).
- Сдвиг всей колонки в транзакции проходит благодаря отложенному UNIQUE.
- `migrate diff` между базой и схемой пустой.
