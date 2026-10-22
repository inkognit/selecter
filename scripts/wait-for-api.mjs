// Ждёт, пока API ответит на /health. VS Code стартует конфигурации связки параллельно,
// поэтому веб ждёт не «своей очереди», а реальной готовности бэкенда.
// Использование: node scripts/wait-for-api.mjs [url] [таймаут, сек]
const url = process.argv[2] ?? 'http://127.0.0.1:3500/api/v1/health';
const timeoutSec = Number(process.argv[3] ?? 180);
const deadline = Date.now() + timeoutSec * 1000;

process.stdout.write(`Жду API: ${url} `);
for (;;) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log('— готов');
      process.exit(0);
    }
  } catch {
    // API ещё не слушает порт — ждём дальше.
  }
  if (Date.now() > deadline) {
    console.error(`\nAPI не ответил за ${timeoutSec} с. Запустите конфигурацию «API» или смотрите её консоль.`);
    process.exit(1);
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 1000));
}
