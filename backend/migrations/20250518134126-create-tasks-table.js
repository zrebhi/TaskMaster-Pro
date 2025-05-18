"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tasks", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      project_id: {
        // Foreign key
        type: Sequelize.UUID, // Must match the type of projects.id
        allowNull: false,
        references: {
          model: "projects", // Name of the target table
          key: "id", // Name of the target column
        },
        onUpdate: "CASCADE", // Standard practice to keep the foreign key in sync
        onDelete: "CASCADE", // Ensure that tasks are deleted if the project is deleted
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      due_date: {
        type: Sequelize.DATEONLY, // DATE (stores only date)
        allowNull: true,
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "medium",
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    // Add index on project_id for faster lookups
    await queryInterface.addIndex("tasks", ["project_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("tasks", ["project_id"]);

    await queryInterface.dropTable("tasks");
  },
};
