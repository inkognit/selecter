import fs from 'node:fs';
import path from 'node:path';

/**
 * Сторож слоёв (WeGo docs/rules/architecture.md §2, устав gonets). Правило держит тест,
 * а не память: новое нарушение — красный `npm test`. Списка исключений нет — их нет и в коде.
 *
 *   presentation ──► application ──► domain
 *                         ▲
 *   infrastructure ───────┘ (реализует порты)
 */

interface Rule {
  id: string;
  description: string;
  /** Файл, к которому применяется правило (путь от src, через «/»). */
  appliesTo: (file: string) => boolean;
  /** Найденное нарушение в тексте файла или null. */
  violation: (source: string) => string | null;
}

const imports = (source: string): string[] => [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
const importMatching = (re: RegExp) => (source: string) => imports(source).find((i) => re.test(i)) ?? null;
const layer = (name: string) => (file: string) => new RegExp(`^modules/[^/]+/${name}/`).test(file);
const isTestFile = (file: string) => /\.spec\.ts$|__tests__\//.test(file);

const RULES: Rule[] = [
  {
    id: 'A-1',
    description: 'presentation не ходит в infrastructure и в БД мимо сервиса',
    appliesTo: layer('presentation'),
    violation: importMatching(/\/infrastructure\/|generated\/prisma|core\/prisma/),
  },
  {
    id: 'A-2',
    description: 'application зависит только от domain и портов, не от infrastructure/presentation/Prisma',
    appliesTo: layer('application'),
    violation: importMatching(/\/infrastructure\/|\/presentation\/|generated\/prisma|core\/prisma/),
  },
  {
    id: 'A-3',
    description: 'domain — чистые правила: без Nest, Prisma и других слоёв',
    appliesTo: layer('domain'),
    violation: importMatching(
      /^@nestjs\/|\/application\/|\/infrastructure\/|\/presentation\/|generated\/prisma|core\//,
    ),
  },
  {
    id: 'A-4',
    description: 'process.env читается только в core/config',
    appliesTo: (file) => !file.startsWith('core/config/'),
    violation: (source) => (/process\.env/.test(source) ? 'process.env' : null),
  },
  {
    id: 'A-5',
    description: 'SQL ($executeRaw/$queryRaw) — только в infrastructure',
    appliesTo: (file) => !layer('infrastructure')(file),
    violation: (source) => /\$(execute|query)Raw/.exec(source)?.[0] ?? null,
  },
  {
    id: 'A-6',
    description: 'контроллер без if/switch/try — принял DTO, вызвал сервис, вернул Response DTO',
    appliesTo: (file) => file.endsWith('.controller.ts'),
    violation: (source) => /\b(if|switch|try)\s*[({]/.exec(source)?.[0] ?? null,
  },
];

function sourceFiles(dir: string, root = dir): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'generated' ? [] : sourceFiles(full, root);
    return e.name.endsWith('.ts') ? [path.relative(root, full).split(path.sep).join('/')] : [];
  });
}

function findViolations(files: { file: string; source: string }[]): string[] {
  return files.flatMap(({ file, source }) =>
    RULES.filter((r) => r.appliesTo(file)).flatMap((r) => {
      const hit = r.violation(source);
      return hit ? [`${r.id} ${file}: ${hit} — ${r.description}`] : [];
    }),
  );
}

describe('архитектура: слои зависят в одну сторону', () => {
  const srcDir = __dirname;
  const files = sourceFiles(srcDir)
    .filter((f) => !isTestFile(f))
    .map((file) => ({ file, source: fs.readFileSync(path.join(srcDir, file), 'utf8') }));

  it('сторож видит файлы модулей (иначе он молча ничего не проверяет)', () => {
    expect(files.some((f) => layer('presentation')(f.file))).toBe(true);
    expect(files.some((f) => layer('infrastructure')(f.file))).toBe(true);
  });

  it('нарушений нет', () => {
    expect(findViolations(files)).toEqual([]);
  });

  // Измеритель проверен на известных ответах: заведомое нарушение ловится, чистый файл — нет.
  it.each([
    ['modules/x/presentation/x.controller.ts', "import { R } from '../infrastructure/x.repository';", 'A-1'],
    [
      'modules/x/application/x.service.ts',
      "import { PrismaService } from '../../../core/prisma/prisma.service';",
      'A-2',
    ],
    ['modules/x/domain/x.ts', "import { Injectable } from '@nestjs/common';", 'A-3'],
    ['modules/x/application/x.service.ts', 'const p = process.env.PORT;', 'A-4'],
    ['modules/x/application/x.service.ts', 'await tx.$queryRaw`SELECT 1`;', 'A-5'],
    ['modules/x/presentation/x.controller.ts', 'if (dto.a) { return 1; }', 'A-6'],
  ])('ловит нарушение в %s (%s)', (file, source, ruleId) => {
    expect(findViolations([{ file, source }])).toEqual([expect.stringContaining(ruleId)]);
  });

  it('не ругается на чистый контроллер', () => {
    const clean = "import { TasksService } from '../application/tasks.service';\nreturn new R(await s.get(id));";
    expect(findViolations([{ file: 'modules/x/presentation/x.controller.ts', source: clean }])).toEqual([]);
  });
});
