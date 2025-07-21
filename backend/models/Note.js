const { DataTypes } = require('sequelize');

function initNoteModel(sequelize) {
    const Note = sequelize.define('Note', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        taskId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: 'task_id',
            references: {
                model: 'tasks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        subtaskId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'subtask_id',
            references: {
                model: 'subtasks',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'notes',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['task_id']
            },
            {
                fields: ['subtask_id']
            }
        ],
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

    return Note;
}

module.exports = initNoteModel; 