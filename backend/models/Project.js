module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    'Project',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        // Foreign key linking to User model
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
          notEmpty: true,
        },
      },
      // createdAt and updatedAt are handled by Sequelize by default
    },
    {
      tableName: 'projects',
      timestamps: true,
    },
  );

  Project.associate = (models) => {
    // Project belongs to a User
    Project.belongsTo(models.User, {
      foreignKey: 'user_id',
      allowNull: false, // Ensure user_id is always present
      onDelete: 'CASCADE',
    });

    // A Project can have many Tasks
    Project.hasMany(models.Task, {
      foreignKey: 'project_id', // The foreign key in the Task model
    });
  };

  return Project;
};
