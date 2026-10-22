import { ConfigError, parseAppConfig } from './app-config';

describe('parseAppConfig — мусор в окружении валит старт', () => {
  const base = { DATABASE_URL: 'postgresql://u:p@localhost:3510/kanban' };

  it('значения по умолчанию', () => {
    expect(parseAppConfig(base)).toMatchObject({
      port: 3500,
      corsOrigins: expect.arrayContaining(['http://localhost:3501']),
    });
  });

  it('без DATABASE_URL — ошибка', () => {
    expect(() => parseAppConfig({})).toThrow(ConfigError);
    expect(() => parseAppConfig({ DATABASE_URL: '  ' })).toThrow(ConfigError);
  });

  it.each(['abc', '0', '70000', '35.5'])('PORT=%p — ошибка', (port) => {
    expect(() => parseAppConfig({ ...base, PORT: port })).toThrow(ConfigError);
  });

  it('CORS_ORIGINS — список через запятую', () => {
    expect(parseAppConfig({ ...base, CORS_ORIGINS: 'http://a, http://b ,' }).corsOrigins).toEqual([
      'http://a',
      'http://b',
    ]);
  });
});
