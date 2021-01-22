module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Installations', {
      teamId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('Installations');
  },
};
