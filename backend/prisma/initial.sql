-- Начальные демо-данные доски. Применяется задачей VS Code «db: seed» после миграций
-- (npm run db:seed). Схему не создаёт — только данные (docs/PROMPT.md, Р-2).
--
-- Идемпотентность: набор применяется ОДИН раз за жизнь базы, отметка — в seed_history.
-- Поэтому удалённые пользователем демо-задачи не возвращаются при следующем запуске.
-- Вернуть демо-доску: задача «infra: reset» (стирает базу целиком).

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM seed_history WHERE name = 'demo_tasks_v1') THEN
        RAISE NOTICE 'initial.sql: demo_tasks_v1 уже применён, пропускаю';
        RETURN;
    END IF;

    -- Демо-задачи встают в конец колонок, если там уже что-то есть.
    INSERT INTO tasks (title, description, status, priority, position, updated_at)
    SELECT v.title, v.description, v.status::task_status, v.priority::task_priority,
           COALESCE((SELECT max(t.position) + 1 FROM tasks t WHERE t.status = v.status::task_status), 0)
               + v.ord,
           now()
    FROM (VALUES
        (0, 'NEW', 'HIGH', 'Настроить CI',
            'Прогон линтера и тестов на каждый push в репозиторий.'),
        (1, 'NEW', 'MEDIUM', 'Добавить фильтр по приоритету',
            NULL),
        (2, 'NEW', 'LOW', 'Тёмная тема для экспорта',
            'Низкий приоритет: сделать после релиза.'),
        (0, 'IN_PROGRESS', 'HIGH', 'Перенос задач между колонками',
            'Drag-and-drop на десктопе и меню «Переместить в…» на телефоне.'),
        (1, 'IN_PROGRESS', 'MEDIUM', 'Состояния загрузки и ошибок',
            E'Скелетоны при загрузке.\nОшибка с кнопкой «Повторить».\nПустая доска.'),
        (0, 'DONE', 'MEDIUM', 'Схема базы данных',
            'Prisma-схема, миграция и ограничения в БД.')
    ) AS v(ord, status, priority, title, description);

    INSERT INTO seed_history (name) VALUES ('demo_tasks_v1');
END
$$;
