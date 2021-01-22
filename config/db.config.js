try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  require('dotenv').config();
} catch (err) {
  // do nothing
}

const defaultConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
};

module.exports = {
  development: {
    ...defaultConfig,
  },
  test: {
    ...defaultConfig,
  },
  production: {
    ...defaultConfig,
  },
};
