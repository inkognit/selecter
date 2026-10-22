import { testDatabaseUrl } from './e2e-env';

// До загрузки AppModule: loadAppConfig не перетирает уже заданную переменную значением из .env.
process.env.DATABASE_URL = testDatabaseUrl();
