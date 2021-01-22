const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Installation extends Model {}

  Installation.init({
    teamId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Installation',
  });

  return Installation;
};
