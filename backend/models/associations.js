const { Sequelize } = require('sequelize');

function setupAssociations(models) {
    // Task - Category association
    models.Task.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
    });
    models.Category.hasMany(models.Task, {
        foreignKey: 'categoryId',
        as: 'tasks'
    });

    // Task - Subtask association
    models.Task.hasMany(models.Subtask, {
        foreignKey: 'taskId',
        as: 'subtasks',
        onDelete: 'CASCADE'
    });
    models.Subtask.belongsTo(models.Task, {
        foreignKey: 'taskId',
        as: 'task'
    });
}

module.exports = setupAssociations; 