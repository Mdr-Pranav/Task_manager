const { Sequelize } = require('sequelize');

function initializeModels(sequelize) {
    // Initialize models
    const Category = require('./Category')(sequelize);
    const { Task, Subtask } = require('./Task')(sequelize);

    // Define associations
    Category.hasMany(Task, {
        foreignKey: 'category_id',
        as: 'tasks',
        onDelete: 'SET NULL'
    });

    Task.belongsTo(Category, {
        foreignKey: 'category_id',
        as: 'category'
    });

    Task.hasMany(Subtask, {
        foreignKey: 'task_id',
        as: 'subtasks',
        onDelete: 'CASCADE'
    });

    Subtask.belongsTo(Task, {
        foreignKey: 'task_id',
        as: 'task'
    });

    return {
        Category,
        Task,
        Subtask,
        sequelize,
        Sequelize
    };
}

module.exports = initializeModels; 