# Промпт работы над проектом «Канбан-доска задач»

Документ — постоянный контекст для разработки. Перед каждым этапом перечитать его и
`PROGRESS.md`. Ответы и документация — на русском.

Источники правил кода:

- `D:/work/personal/WeGo/docs/rules/codestyle-node.md` — Ports & Adapters, конверт API,
  fail-closed, тесты на фейках, обязательный smoke;
- `D:/work/personal/WeGo/docs/rules/architecture.md` — слои зависят в одну сторону;
- `D:/work/personal/gonets/CLAUDE.md` (устав) — четыре слоя модуля, изоляция DTO, тонкий
  контроллер, инвариант в БД + catch на SQLSTATE, идемпотентность против двойного клика.

## Принятые решения (22.10.2026)

| №   | Вопрос                    | Решение                                                                                      |
| --- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Р-1 | Prisma в рантайме         | Prisma Client используется, но только внутри репозитория за портом `TASKS_REPOSITORY`        |
| Р-2 | Роль `initial.sql`        | Схема — только миграции Prisma; `initial.sql` — идемпотентные демо-данные                    |
| Р-3 | Prettier                  | Стиль gonets: `singleQuote: true`, `printWidth: 120`, `trailingComma: all`                   |
| Р-4 | Структура репозитория     | `backend/` (NestJS) и `web/` (Next.js); `test-server/` и `test-client/` удаляются            |
| Р-5 | Порядок внутри колонки    | Есть: поле `position`, drag-and-drop на десктопе, меню «Переместить в…» на телефоне          |

## Этап 0. Идея

Канбан-доска задач для одного пользователя: одна доска, задача проходит путь
«Новая» → «В работе» → «Готово». Цель — полноценный функционал тестового задания на чистой
архитектуре NestJS / Prisma / PostgreSQL / Next.js / MUI.

## Этап 1. ТЗ — `docs/TZ.md`

Функциональные и нефункциональные требования, границы (что не делаем), сценарии
пользователя, состояния интерфейса, критерии приёмки по каждому пункту.

## Этап 2. Дизайн — `docs/DESIGN.md`

- Десктоп: три колонки в ряд, заголовок колонки со счётчиком, карточка — название, чип
  приоритета, обрезанное описание.
- Телефон (< 768px): колонки — вкладки MUI `Tabs`; `100dvh` + `env(safe-area-inset-bottom)`;
  создание — FAB.
- Диалог задачи (MUI `Dialog`, на телефоне fullScreen): просмотр / редактирование; удаление
  через подтверждение.
- Snackbar на результат действий; перенос оптимистичный с откатом при ошибке.
- `data-testid` на каждом интерактивном элементе.

## Этап 3. Архитектура БД

```prisma
enum TaskStatus   { NEW  IN_PROGRESS  DONE }
enum TaskPriority { LOW  MEDIUM  HIGH }

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  title       String       @db.VarChar(200)
  description String?      @db.Text
  status      TaskStatus   @default(NEW)
  priority    TaskPriority @default(MEDIUM)
  position    Int
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt      @map("updated_at")
  @@index([status, position])
  @@map("tasks")
}
```

- `snake_case` в БД, `camelCase` в коде.
- Инварианты в БД: `CHECK (char_length(btrim(title)) BETWEEN 1 AND 200)`; нарушение
  ловится по SQLSTATE и превращается в доменную ошибку, не в 500.
- Перенос с переиндексацией `position` — в одной транзакции.
- Новый статус = значение enum + миграция + подпись колонки на фронте.

## Этап 4. Бэкенд (NestJS)

```text
backend/src/
├── core/                      # CoreModule: конфиг (проверка env на старте), Prisma
├── common/                    # конверт API, exception-фильтр, базовые коды ошибок
└── modules/tasks/
    ├── domain/                # чистые правила (перестановка позиций), без Nest и БД
    ├── application/           # TasksService, порт TASKS_REPOSITORY, коды ошибок
    ├── infrastructure/        # tasks.repository.prisma.ts — единственное место с Prisma
    ├── presentation/          # контроллер, request DTO, *.response.dto.ts
    └── tasks.module.ts
```

API `/api/v1`, ответ `{ success, data, meta, error }`:

| Метод  | Путь              | Назначение                            |
| ------ | ----------------- | ------------------------------------- |
| GET    | `/tasks`          | все задачи, отсортированы по колонкам |
| GET    | `/tasks/:id`      | одна задача                           |
| POST   | `/tasks`          | создать (в конец колонки NEW)         |
| PATCH  | `/tasks/:id`      | изменить title/description/priority   |
| PATCH  | `/tasks/:id/move` | `{ status, position }`                |
| DELETE | `/tasks/:id`      | удалить                               |
| GET    | `/health`         | готовность (для ожидания фронтом)     |

- Коды ошибок snake_case: `task_not_found`, `validation_failed`, `task_conflict`, `internal_error`.
  Один глобальный exception-фильтр мапит их на HTTP-статусы.
- Request и Response DTO — разные классы; Response DTO присваивает поля поимённо.
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`, ошибка валидации → 422.
- Swagger на `/api/docs`.

## Этап 5. Фронт (Next.js App Router + MUI)

- Единственный API-клиент `api/client.ts`: распаковка конверта, `humanizeApiError` по коду.
  Различать `internal_error` («ошибка сервера») и `http_NNN`/сетевую («бэкенд недоступен»).
- TanStack Query: кэш, повтор, оптимистичный перенос.
- `@dnd-kit` для перетаскивания; на телефоне — меню «Переместить в…».
- Кнопки отправки блокируются на время запроса (двойной клик).

## Этап 6. Инфраструктура запуска

- `docker-compose.yml`: PostgreSQL 16 с healthcheck.
- `.vscode/tasks.json`: `infra: up` (`docker compose up -d --wait`) → `db: migrate`
  (`prisma migrate deploy`) → `db: seed` (`initial.sql`) → `stack: prepare`; `infra: reset`
  стирает данные.
- `.vscode/launch.json`: API, веб, связка «ВСЁ»; веб ждёт `/health`.
- Порты: 3500 — API, 3501 — веб, 3510 — PostgreSQL.
- Секреты только в `.env` (в `.gitignore`), в репозитории — `.env.example`.

## Этап 7. Правила разработки

- Prettier по Р-3; ESLint без ошибок.
- Слои: `presentation → application → domain`; `infrastructure` реализует порты
  `application`. Сервис не знает Prisma; контроллер без `if/try`, без репозитория,
  без `process.env`.
- Тесты:
  - unit сервиса на in-memory фейке репозитория (Jest), включая негатив: 404, 422;
  - unit доменных правил позиций;
  - e2e (supertest) против живого PostgreSQL.
- Проверка не завелась — ищем другой способ проверить, а не удаляем проверку.
- Этап = коммит + запись в `PROGRESS.md`.

## Этап 8. Правила приёмки (Definition of Done)

1. `tsc --noEmit` чисто, lint чисто, все тесты зелёные.
2. Smoke: с чистой БД (`infra: reset`) запуск из Debug поднимает всё; в браузере 0 ошибок
   консоли; скриншоты десктопа и телефона (375px).
3. Ручной чек-лист: каждый пункт обязательного функционала, перезагрузка страницы,
   выключенный бэкенд (состояние ошибки), пустая доска.
4. В отчёте строка «поднял, открыл, 0 ошибок консоли» — без неё этап не сдан.
5. README: запуск, решения, ограничения, затраченное время (по датам коммитов этапов).
