const { URL } = require('url');

try {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  require('dotenv').config();
} catch (err) {
  // do nothing
}

const { pathname, username, password, hostname: host, port } = new URL(process.env.DATABASE_URL);

const defaultConfig = {
  username,
  password,
  host,
  port,
  database: pathname.substring(1),
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
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
