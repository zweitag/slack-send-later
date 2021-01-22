/* eslint-disable global-require */
const Sequelize = require('sequelize');
const dbConfig = require('../../config/db.config.js')[process.env.APP_ENV || 'development'];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
});

const models = {
  installations: require('./installation.js')(sequelize, Sequelize),
};

module.exports = {
  Sequelize,
  sequelize,
  ...models,
};
