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

// Create a test task if no tasks exist
async function createTestTask(models) {
    try {
        console.log('Checking for existing tasks...');
        const taskCount = await models.Task.count();
        console.log('Current task count:', taskCount);
        
        if (taskCount === 0) {
            console.log('Creating test task...');
            // Create a test task
            const task = await models.Task.create({
                title: 'Test Task',
                description: 'This is a test task',
                status: 'todo',
                priority: 'medium',
                position: 0
            });
            console.log('Test task created:', task.toJSON());

            console.log('Creating test subtask...');
            // Create a subtask for the test task
            const subtask = await models.Subtask.create({
                title: 'Test Subtask',
                description: 'This is a test subtask',
                taskId: task.id
            });
            console.log('Test subtask created:', subtask.toJSON());

            console.log('Creating test task note...');
            // Create notes for both task and subtask
            const taskNote = await models.Note.create({
                content: 'This is a test task note',
                taskId: task.id
            });
            console.log('Test task note created:', taskNote.toJSON());

            console.log('Creating test subtask note...');
            const subtaskNote = await models.Note.create({
                content: 'This is a test subtask note',
                taskId: task.id,
                subtaskId: subtask.id
            });
            console.log('Test subtask note created:', subtaskNote.toJSON());

            console.log('Test task and related items created successfully');

            // Verify the task was created with all relations
            const verifyTask = await models.Task.findByPk(task.id, {
                include: [
                    {
                        model: models.Subtask,
                        as: 'subtasks',
                        include: [{
                            model: models.Note,
                            as: 'subtaskNotes'
                        }]
                    },
                    {
                        model: models.Note,
                        as: 'taskNotes'
                    }
                ]
            });
            console.log('Verified created task with relations:', JSON.stringify(verifyTask, null, 2));
        } else {
            console.log('Tasks already exist, skipping test task creation');
        }
    } catch (error) {
        console.error('Error creating test task:', error);
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
        
        // Create database if it doesn't exist
        await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
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
        
        // Initialize models
        models = initializeModels(sequelize);
        
        // Check if tables exist
        const tableCheckQueries = [
            "SHOW TABLES LIKE 'tasks'",
            "SHOW TABLES LIKE 'subtasks'",
            "SHOW TABLES LIKE 'notes'",
            "SHOW TABLES LIKE 'categories'"
        ];

        const results = await Promise.all(tableCheckQueries.map(query => sequelize.query(query)));
        const tablesExist = results.every(result => result[0].length > 0);

        if (!tablesExist) {
            // If any tables are missing, create them
            await sequelize.sync({ alter: true });
            
            // Create default categories if needed
            const categoryCount = await models.Category.count();
            if (categoryCount === 0) {
                await createDefaultCategories(models);
            }

            // Create test task if needed
            const taskCount = await models.Task.count();
            if (taskCount === 0) {
                await createTestTask(models);
            }
        } else {
            // If tables exist, just alter them to add any new columns
            await sequelize.sync({ alter: true });
        }

        return models;
    } catch (error) {
        console.error('Database initialization error:', error.message);
        
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