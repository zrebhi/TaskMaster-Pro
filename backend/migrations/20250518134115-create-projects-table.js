"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("projects", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        // Foreign key
        type: Sequelize.UUID, // Must match the type of users.id
        allowNull: false,
        references: {
          model: "users", // Name of the target table
          key: "id", // Name of the target column
        },
        onUpdate: "CASCADE", // Standard practice to keep the foreign key in sync
        onDelete: "CASCADE", // Ensure that projects are deleted if the user is deleted
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add index on user_id for faster lookups
    await queryInterface.addIndex("projects", ["user_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("projects", ["user_id"]);

    await queryInterface.dropTable("projects");
  },
};
