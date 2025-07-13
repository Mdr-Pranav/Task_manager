const { DataTypes } = require('sequelize');

function initCategoryModel(sequelize) {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        color: {
            type: DataTypes.STRING(7),
            allowNull: false,
            defaultValue: '#3B82F6',
            validate: {
                is: /^#[0-9A-F]{6}$/i
            }
        },
        icon: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'folder',
            validate: {
                notEmpty: true
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'categories',
        underscored: true,
        timestamps: true,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            {
                unique: true,
                fields: ['name']
            }
        ]
    });

    return Category;
}

module.exports = initCategoryModel; 