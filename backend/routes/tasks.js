const express = require('express');
const { body, validationResult } = require('express-validator');

// Export a function that takes models as a parameter and returns a router
module.exports = function(models) {
    const router = express.Router();

    // Validation middleware
    const validateTask = [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('status').isIn(['todo', 'in_progress', 'completed']).withMessage('Invalid status'),
        body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
        body('dueDate').optional().isISO8601().withMessage('Invalid date format')
    ];

    // GET /api/tasks
    router.get('/', async (req, res) => {
        try {
            const tasks = await models.Task.findAll({
                include: [
                    {
                        model: models.Category,
                        as: 'category'
                    },
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
                ],
                order: [['position', 'ASC']]
            });
            res.json(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    });

    // POST /api/tasks
    router.post('/', validateTask, async (req, res) => {
        let transaction;
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Start transaction
            transaction = await models.sequelize.transaction();

            // Get the highest position
            const maxPosition = await models.Task.max('position', { transaction }) || 0;
            
            // Create task with next position
            const task = await models.Task.create({
                ...req.body,
                position: maxPosition + 1
            }, { transaction });

            // Fetch the created task with its relations
            const taskWithRelations = await models.Task.findByPk(task.id, {
                include: [
                    {
                        model: models.Category,
                        as: 'category'
                    },
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
                ],
                transaction
            });

            // Commit transaction
            await transaction.commit();

            res.status(201).json(taskWithRelations);
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            console.error('Error creating task:', error);
            res.status(400).json({ error: 'Failed to create task: ' + error.message });
        }
    });

    // PUT /api/tasks/:id
    router.put('/:id', validateTask, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const task = await models.Task.findByPk(req.params.id);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            await task.update(req.body);

            // Fetch updated task with relations
            const updatedTask = await models.Task.findByPk(task.id, {
                include: [
                    {
                        model: models.Category,
                        as: 'category'
                    },
                    {
                        model: models.Subtask,
                        as: 'subtasks'
                    }
                ]
            });

            res.json(updatedTask);
        } catch (error) {
            console.error('Error updating task:', error);
            res.status(400).json({ error: 'Failed to update task' });
        }
    });

    // DELETE /api/tasks/:id
    router.delete('/:id', async (req, res) => {
        let transaction;
        try {
            // Start transaction
            transaction = await models.sequelize.transaction();

            // Find the task with its relations
            const task = await models.Task.findByPk(req.params.id, {
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
                ],
                transaction
            });

            if (!task) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Task not found' });
            }

            // Delete all related notes first
            if (task.taskNotes && task.taskNotes.length > 0) {
                await models.Note.destroy({
                    where: { taskId: task.id, subtaskId: null },
                    transaction
                });
            }

            // Delete all subtask notes and subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                // Delete subtask notes
                for (const subtask of task.subtasks) {
                    if (subtask.subtaskNotes && subtask.subtaskNotes.length > 0) {
                        await models.Note.destroy({
                            where: { subtaskId: subtask.id },
                            transaction
                        });
                    }
                }

                // Delete subtasks
                await models.Subtask.destroy({
                    where: { taskId: task.id },
                    transaction
                });
            }

            // Finally delete the task
            await task.destroy({ transaction });

            // Commit transaction
            await transaction.commit();

            res.status(204).send();
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            console.error('Error deleting task:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    });

    // Reorder tasks
    router.post('/reorder', async (req, res) => {
        let transaction;
        
        try {
            const { taskOrders } = req.body;
            
            // Validate input
            if (!Array.isArray(taskOrders)) {
                return res.status(400).json({ message: 'taskOrders must be an array' });
            }

            // Start transaction
            transaction = await models.sequelize.transaction();

            // Update each task's position
            const updatePromises = taskOrders.map(({ id, position }) => {
                return models.Task.update(
                    { position },
                    { 
                        where: { id },
                        transaction
                    }
                );
            });

            // Wait for all updates to complete
            await Promise.all(updatePromises);

            // Commit transaction
            await transaction.commit();

            // Return updated tasks
            const tasks = await models.Task.findAll({
                include: [
                    {
                        model: models.Category,
                        as: 'category'
                    }
                ],
                order: [['position', 'ASC']]
            });

            res.json(tasks);
        } catch (error) {
            // Rollback transaction on error
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            
            console.error('Error in reorder tasks:', error);
            res.status(500).json({ 
                message: 'Failed to reorder tasks',
                error: error.message
            });
        }
    });

    // POST /api/tasks/:taskId/subtasks
    router.post('/:taskId/subtasks', async (req, res) => {
        try {
            const task = await models.Task.findByPk(req.params.taskId);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            const subtask = await models.Subtask.create({
                ...req.body,
                taskId: task.id
            });

            res.status(201).json(subtask);
        } catch (error) {
            console.error('Error creating subtask:', error);
            res.status(400).json({ error: 'Failed to create subtask' });
        }
    });

    // PUT /api/tasks/:taskId/subtasks/:subtaskId
    router.put('/:taskId/subtasks/:subtaskId', async (req, res) => {
        try {
            const subtask = await models.Subtask.findOne({
                where: {
                    id: req.params.subtaskId,
                    taskId: req.params.taskId
                }
            });

            if (!subtask) {
                return res.status(404).json({ error: 'Subtask not found' });
            }

            // Update only allowed fields
            const allowedFields = ['title', 'description', 'completed'];
            const updateData = {};
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            });

            await subtask.update(updateData);

            // Return the updated subtask
            const updatedSubtask = await models.Subtask.findOne({
                where: {
                    id: req.params.subtaskId,
                    taskId: req.params.taskId
                }
            });
            res.json(updatedSubtask);
        } catch (error) {
            console.error('Error updating subtask:', error);
            res.status(400).json({ error: 'Failed to update subtask' });
        }
    });

    // DELETE /api/tasks/:taskId/subtasks/:subtaskId
    router.delete('/:taskId/subtasks/:subtaskId', async (req, res) => {
        try {
            const subtask = await models.Subtask.findOne({
                where: {
                    id: req.params.subtaskId,
                    taskId: req.params.taskId
                }
            });

            if (!subtask) {
                return res.status(404).json({ error: 'Subtask not found' });
            }

            await subtask.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting subtask:', error);
            res.status(500).json({ error: 'Failed to delete subtask' });
        }
    });

    // PATCH /api/tasks/:taskId/subtasks/:subtaskId/toggle
    router.patch('/:taskId/subtasks/:subtaskId/toggle', async (req, res) => {
        let transaction;
        try {
            // Start transaction
            transaction = await models.sequelize.transaction();

            // Find the subtask
            const subtask = await models.Subtask.findOne({
                where: {
                    id: req.params.subtaskId,
                    taskId: req.params.taskId
                },
                transaction
            });

            if (!subtask) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Subtask not found' });
            }

            // Toggle the completed status
            const updatedSubtask = await subtask.update({
                completed: !subtask.completed
            }, { transaction });

            // Commit transaction
            await transaction.commit();

            // Return the updated subtask
            res.json(updatedSubtask);
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            console.error('Error toggling subtask:', error);
            res.status(400).json({ error: 'Failed to toggle subtask' });
        }
    });

    // PATCH /api/tasks/:id/position
    router.patch('/:id/position', async (req, res) => {
        let transaction;
        try {
            const { position } = req.body;
            
            if (typeof position !== 'number') {
                return res.status(400).json({ error: 'Position must be a number' });
            }

            // Start transaction using sequelize from models
            transaction = await models.sequelize.transaction();

            // Find the task
            const task = await models.Task.findByPk(req.params.id, { transaction });
            if (!task) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Task not found' });
            }

            // Get the task that currently has the target position
            const taskAtPosition = await models.Task.findOne({
                where: { position },
                transaction
            });

            // If there's a task at the target position, swap positions
            if (taskAtPosition) {
                await taskAtPosition.update({ position: task.position }, { transaction });
            }

            // Update the task's position
            await task.update({ position }, { transaction });

            // Commit transaction
            await transaction.commit();

            // Return the updated task with relations
            const updatedTask = await models.Task.findByPk(task.id, {
                include: [
                    {
                        model: models.Category,
                        as: 'category'
                    },
                    {
                        model: models.Subtask,
                        as: 'subtasks'
                    }
                ]
            });

            res.json(updatedTask);
        } catch (error) {
            if (transaction) {
                try {
                    await transaction.rollback();
                } catch (rollbackError) {
                    console.error('Error rolling back transaction:', rollbackError);
                }
            }
            console.error('Error updating task position:', error);
            res.status(400).json({ error: 'Failed to update task position' });
        }
    });

    return router;
}; 