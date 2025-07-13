const express = require('express');
const { body, validationResult } = require('express-validator');

// Export a function that takes models as a parameter and returns a router
module.exports = function(models) {
    const router = express.Router();

    // Validation middleware
    const validateCategory = [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('color').matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format'),
        body('icon').trim().notEmpty().withMessage('Icon is required')
    ];

    // GET /api/categories
    router.get('/', async (req, res) => {
        try {
            const categories = await models.Category.findAll({
                include: [{
                    model: models.Task,
                    as: 'tasks'
                }],
                order: [['name', 'ASC']]
            });
            res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    });

    // Get category by ID
    router.get('/:id', async (req, res) => {
        try {
            const category = await models.Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.json(category);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    // POST /api/categories
    router.post('/', validateCategory, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const category = await models.Category.create(req.body);
            res.status(201).json(category);
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(400).json({ error: 'Failed to create category' });
        }
    });

    // PUT /api/categories/:id
    router.put('/:id', validateCategory, async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const category = await models.Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            await category.update(req.body);
            res.json(category);
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(400).json({ error: 'Failed to update category' });
        }
    });

    // DELETE /api/categories/:id
    router.delete('/:id', async (req, res) => {
        try {
            const category = await models.Category.findByPk(req.params.id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }

            // Update tasks that reference this category
            await models.Task.update(
                { categoryId: null },
                { where: { categoryId: req.params.id } }
            );

            await category.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    });

    return router;
}; 