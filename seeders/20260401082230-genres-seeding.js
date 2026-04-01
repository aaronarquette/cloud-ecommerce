'use strict';
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const rawData = require(path.join(__dirname, '../data/genres.json'));

    const genres = rawData.map(genre => ({
      ...genre,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('Genres', genres, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Genres', null, {});
  }
};