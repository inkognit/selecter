// Unit-тесты: без БД и без сети (фейки репозиториев). e2e — test/jest-e2e.config.js.
module.exports = {
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: { '^.+\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
};
