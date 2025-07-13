const express = require('express');

// Export a function that takes models as a parameter and returns a router
module.exports = function(models) {
    const router = express.Router();

    // POST /api/settings/clear-data
    router.post('/clear-data', async (req, res) => {
        try {
            // Use a transaction to ensure all operations succeed or none do
            await models.sequelize.transaction(async (t) => {
                // Delete all subtasks first due to foreign key constraints
                await models.Subtask.destroy({ 
                    where: {},
                    transaction: t 
                });

                // Delete all tasks
                await models.Task.destroy({ 
                    where: {},
                    transaction: t 
                });

                // Delete all categories
                await models.Category.destroy({ 
                    where: {},
                    transaction: t 
                });
            });

            res.status(200).json({ message: 'All data cleared successfully' });
        } catch (error) {
            console.error('Error clearing data:', error);
            res.status(500).json({ error: 'Failed to clear data' });
        }
    });

    return router;
}; 