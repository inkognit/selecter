
-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "task_status" NOT NULL DEFAULT 'NEW',
    "priority" "task_priority" NOT NULL DEFAULT 'MEDIUM',
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_history" (
    "name" VARCHAR(100) NOT NULL,
    "applied_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seed_history_pkey" PRIMARY KEY ("name")
);

-- Инварианты, которые Prisma не выражает в схеме (docs/DB.md, раздел 3).
-- Код проверяет то же самое на входе; ограничение в БД — последний рубеж.

ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_title_length_check"
        CHECK (char_length(btrim("title")) BETWEEN 1 AND 200),
    ADD CONSTRAINT "tasks_description_length_check"
        CHECK ("description" IS NULL OR char_length("description") <= 5000),
    ADD CONSTRAINT "tasks_position_check"
        CHECK ("position" >= 0);

-- Одна позиция в колонке — одна задача. Отложенная проверка (на COMMIT), чтобы
-- переиндексация колонки внутри транзакции не падала на промежуточных дублях.
-- Индекс ограничения заодно обслуживает выборку доски ORDER BY status, position.
ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_status_position_key"
        UNIQUE ("status", "position") DEFERRABLE INITIALLY DEFERRED;
