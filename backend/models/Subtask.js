const { DataTypes } = require('sequelize');

function initSubtaskModel(sequelize) {
    const Subtask = sequelize.define('Subtask', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        }
    }, {
        tableName: 'subtasks',
        underscored: true,
        timestamps: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            {
                fields: ['task_id']
            }
        ]
    });

    return Subtask;
}

module.exports = initSubtaskModel; 