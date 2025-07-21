const initTaskModel = require('./Task');
const initCategoryModel = require('./Category');
const initSubtaskModel = require('./Subtask');
const initNoteModel = require('./Note');
const setupAssociations = require('./associations');

function initializeModels(sequelize) {
    // Initialize models
    const models = {
        Task: initTaskModel(sequelize),
        Category: initCategoryModel(sequelize),
        Subtask: initSubtaskModel(sequelize),
        Note: initNoteModel(sequelize),
        sequelize: sequelize // Add sequelize instance to models object
    };

    // Setup associations between models
    setupAssociations(models);

    return models;
}

module.exports = initializeModels; 