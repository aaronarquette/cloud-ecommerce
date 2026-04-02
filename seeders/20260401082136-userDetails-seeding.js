'use strict';
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
 async up(queryInterface, Sequelize) {
    const rawData = require(path.join(__dirname, '../data/userDetails.json'));

    const userDetails = rawData.map(detail => ({
      ...detail,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('UserDetails', userDetails, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserDetails', null, {});
  }
};