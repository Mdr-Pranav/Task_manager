const { Sequelize } = require('sequelize');
const initializeModels = require('../models');
require('dotenv').config();

const DB_CONFIG = {
    database: process.env.DB_NAME || 'task_tracker',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'pranav@2005',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        connectTimeout: 60000,
        charset: 'utf8mb4'
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        charset: 'utf8mb4'
    }
};

let sequelize = null;
let models = null;

// Create default categories if they don't exist
async function createDefaultCategories(models) {
    const defaultCategories = [
        { name: 'Work', color: '#10B981', icon: 'briefcase', description: 'Work-related tasks' },
        { name: 'Personal', color: '#3B82F6', icon: 'user', description: 'Personal tasks' },
        { name: 'Shopping', color: '#F59E0B', icon: 'shopping-cart', description: 'Shopping lists' },
        { name: 'Health', color: '#EF4444', icon: 'heart', description: 'Health and fitness tasks' }
    ];

    try {
        for (const category of defaultCategories) {
            await models.Category.findOrCreate({
                where: { name: category.name },
                defaults: category
            });
        }
        console.log('Default categories checked/created successfully');
    } catch (error) {
        console.error('Error checking/creating default categories:', error);
        throw error;
    }
}

// Initialize the database connection and models
async function initializeDatabase(forceSync = false) {
    // First try to connect without database to check if we need to create it
    const rootConfig = {
        ...DB_CONFIG,
        database: null
    };

    const tempSequelize = new Sequelize(
        null,
        rootConfig.username,
        rootConfig.password,
        rootConfig
    );

    try {
        await tempSequelize.authenticate();
        console.log('Connected to MySQL server successfully.');
        
        // Create database if it doesn't exist
        await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log('Database exists or was created successfully.');
    } finally {
        await tempSequelize.close();
    }

    try {
        // Create the main sequelize instance
        sequelize = new Sequelize(
            DB_CONFIG.database,
            DB_CONFIG.username,
            DB_CONFIG.password,
            {
                ...DB_CONFIG,
                logging: false // Disable logging for normal operation
            }
        );

        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Initialize models
        models = initializeModels(sequelize);
        
        // Sync models - only create tables if they don't exist
        if (forceSync) {
            // Force sync will drop and recreate all tables
            await sequelize.sync({ force: true });
            console.log('Database synchronized with force.');
            
            // Create default categories after force sync
            await createDefaultCategories(models);
        } else {
            // Normal sync will only create missing tables
            await sequelize.sync({ alter: true });
            console.log('Database synchronized - tables altered as needed.');
            
            // Check if we need to create default categories
            const categoryCount = await models.Category.count();
            if (categoryCount === 0) {
                await createDefaultCategories(models);
            }
        }

        return models;
    } catch (error) {
        console.error('Database initialization error:', {
            message: error.message,
            code: error.code,
            name: error.name,
            sql: error.sql
        });
        
        if (sequelize) {
            try {
                await sequelize.close();
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
        
        throw error;
    }
}

// Get sequelize instance
function getSequelize() {
    if (!sequelize) {
        throw new Error('Database not initialized. Please wait for initialization to complete.');
    }
    return sequelize;
}

// Get models
function getModels() {
    if (!models) {
        throw new Error('Models not initialized. Please wait for initialization to complete.');
    }
    return models;
}

module.exports = {
    sequelize: getSequelize,
    models: getModels,
    initializeDatabase,
    DB_CONFIG
}; 