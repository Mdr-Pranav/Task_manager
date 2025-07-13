const { DataTypes } = require('sequelize');

function initTaskModel(sequelize) {
    const Task = sequelize.define('Task', {
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
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'due_date'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
            defaultValue: 'medium',
            validate: {
                isIn: [['low', 'medium', 'high']]
            }
        },
        status: {
            type: DataTypes.ENUM('todo', 'in_progress', 'completed'),
            defaultValue: 'todo',
            validate: {
                isIn: [['todo', 'in_progress', 'completed']]
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        categoryId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'category_id',
            references: {
                model: 'categories',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        },
        position: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0
        },
        attachments: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isValidAttachments(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Attachments must be an array');
                    }
                    value.forEach(attachment => {
                        if (!attachment.filename || !attachment.path || !attachment.uploadedAt) {
                            throw new Error('Invalid attachment format');
                        }
                    });
                }
            }
        }
    }, {
        tableName: 'tasks',
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ['status']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['due_date']
            },
            {
                fields: ['category_id']
            },
            {
                fields: ['position']
            }
        ],
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    });

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

    return { Task, Subtask };
}

module.exports = initTaskModel; 