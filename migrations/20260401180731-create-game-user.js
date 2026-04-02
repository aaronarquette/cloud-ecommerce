'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GameUsers', {
      id: { 
        allowNull: false, 
        autoIncrement: true, 
        primaryKey: true, 
        type: Sequelize.INTEGER 
      },

      UserId: { 
        type: Sequelize.INTEGER, 
        references: { model: 'Users', key: 'id' } 
      },

      GameId: { 
        type: Sequelize.INTEGER, 
        references: { model: 'Games', key: 'id' } 
      },

      purchasedAt: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.NOW 
      },

      rating: { 
        type: Sequelize.INTEGER, 
        allowNull: true 
      },

      review: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },

      createdAt: { 
        allowNull: false, 
        type: Sequelize.DATE 
      },

      updatedAt: { 
        allowNull: false, 
        type: Sequelize.DATE 
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('GameUsers');
  }
};
