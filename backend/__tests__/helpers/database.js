const { sequelize } = require('../../models');

class DatabaseTestHelper {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        "NODE_ENV not set to 'test'. Aborting to prevent data loss."
      );
    }

    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    this.isInitialized = true;
  }

  async close() {
    if (sequelize) {
      await sequelize.close();
    }
    this.isInitialized = false;
  }

  async truncateAllTables() {
    const transaction = await sequelize.transaction();
    try {
      const models = Object.keys(sequelize.models);

      for (const modelName of models) {
        const model = sequelize.models[modelName];
        await model.destroy({
          where: {},
          truncate: { cascade: true },
          transaction,
        });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

const databaseTestHelper = new DatabaseTestHelper();
module.exports = databaseTestHelper;
