'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      project_id: {
        type: Sequelize.UUID, // Match the type of Project.id
        allowNull: false,
        references: {
          model: 'projects', // Name of the referenced table
          key: 'id',         // Name of the referenced column in 'projects' table
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // This ensures tasks are deleted when a project is deleted
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
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: true, // Can be null if not set explicitly
        defaultValue: 2, // Default to Medium (1:Low, 2:Medium, 3:High)
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { // Sequelize uses snake_case for these in migrations by default
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add an index on project_id for faster lookups
    await queryInterface.addIndex('tasks', ['project_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', ['project_id']); // Remove index first
    await queryInterface.dropTable('tasks');
  },
};
