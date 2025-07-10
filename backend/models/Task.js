module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        // Foreign key linking to Project model
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [1, 255],
            msg: 'Task title must be between 1 and 255 characters.',
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      priority: {
        // Example: 1: Low, 2: Medium, 3: High
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2, // Default to Medium
        validate: {
          isIn: {
            args: [[1, 2, 3]],
            msg: 'Priority must be 1 (Low), 2 (Medium), or 3 (High).',
          },
        },
      },
      is_completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // createdAt and updatedAt are handled by Sequelize by default (timestamps: true)
    },
    {
      tableName: 'tasks',
      timestamps: true, // This enables createdAt and updatedAt columns
      underscored: true, // To map camelCase to snake_case
    }
  );

  Task.associate = (models) => {
    // A Task belongs to a Project
    Task.belongsTo(models.Project, {
      foreignKey: 'project_id', // This task's column that references Project
      allowNull: false, // Ensure project_id is always present
      onDelete: 'CASCADE', // If a Project is deleted, its Tasks are also deleted
    });
  };

  return Task;
};
