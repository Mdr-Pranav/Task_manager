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

    // Task - Note association
    models.Task.hasMany(models.Note, {
        foreignKey: 'taskId',
        as: 'taskNotes',
        onDelete: 'CASCADE'
    });
    models.Note.belongsTo(models.Task, {
        foreignKey: 'taskId',
        as: 'task'
    });

    // Subtask - Note association
    models.Subtask.hasMany(models.Note, {
        foreignKey: 'subtaskId',
        as: 'subtaskNotes',
        onDelete: 'CASCADE'
    });
    models.Note.belongsTo(models.Subtask, {
        foreignKey: 'subtaskId',
        as: 'subtask'
    });
}

module.exports = setupAssociations; 