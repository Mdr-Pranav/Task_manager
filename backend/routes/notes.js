const express = require('express');

module.exports = function(models) {
    const router = express.Router();

    // GET /api/notes/task/:taskId
    router.get('/task/:taskId', async (req, res) => {
        try {
            const notes = await models.Note.findAll({
                where: {
                    taskId: req.params.taskId,
                    subtaskId: null
                }
            });
            res.json(notes);
        } catch (error) {
            console.error('Error fetching task notes:', error);
            res.status(500).json({ error: 'Failed to fetch notes' });
        }
    });

    // GET /api/notes/subtask/:subtaskId
    router.get('/subtask/:subtaskId', async (req, res) => {
        try {
            const notes = await models.Note.findAll({
                where: {
                    subtaskId: req.params.subtaskId
                }
            });
            res.json(notes);
        } catch (error) {
            console.error('Error fetching subtask notes:', error);
            res.status(500).json({ error: 'Failed to fetch notes' });
        }
    });

    // POST /api/notes/task/:taskId
    router.post('/task/:taskId', async (req, res) => {
        try {
            const note = await models.Note.create({
                content: req.body.content,
                taskId: req.params.taskId
            });
            res.status(201).json(note);
        } catch (error) {
            console.error('Error creating task note:', error);
            res.status(400).json({ error: 'Failed to create note' });
        }
    });

    // POST /api/notes/subtask/:taskId/:subtaskId
    router.post('/subtask/:taskId/:subtaskId', async (req, res) => {
        try {
            const note = await models.Note.create({
                content: req.body.content,
                taskId: req.params.taskId,
                subtaskId: req.params.subtaskId
            });
            res.status(201).json(note);
        } catch (error) {
            console.error('Error creating subtask note:', error);
            res.status(400).json({ error: 'Failed to create note' });
        }
    });

    // PUT /api/notes/:noteId
    router.put('/:noteId', async (req, res) => {
        try {
            const note = await models.Note.findByPk(req.params.noteId);
            if (!note) {
                return res.status(404).json({ error: 'Note not found' });
            }

            await note.update({
                content: req.body.content
            });

            res.json(note);
        } catch (error) {
            console.error('Error updating note:', error);
            res.status(400).json({ error: 'Failed to update note' });
        }
    });

    // DELETE /api/notes/:noteId
    router.delete('/:noteId', async (req, res) => {
        try {
            const note = await models.Note.findByPk(req.params.noteId);
            if (!note) {
                return res.status(404).json({ error: 'Note not found' });
            }

            await note.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting note:', error);
            res.status(500).json({ error: 'Failed to delete note' });
        }
    });

    return router;
}; 