'use strict';
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
    const rawData = require(path.join(__dirname, '../data/users.json'));

    const users = rawData.map(user => ({
      ...user,
      password: bcrypt.hashSync(user.password, 10),
      balance: 500000,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('Users', users, {});
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.bulkDelete('Users', null, {});
  }
};