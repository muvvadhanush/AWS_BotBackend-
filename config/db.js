const { Sequelize } = require("sequelize");
const settings = require("./settings");

const sequelize = new Sequelize(
  settings.db.database,
  settings.db.username,
  settings.db.password,
  {
    host: settings.db.host,
    dialect: settings.db.dialect,
    port: settings.db.port,
    logging: settings.logging === 'verbose' ? console.log : false,
    dialectOptions: {
      ssl: settings.db.ssl
    }
  }
);

module.exports = sequelize;
