import API from '../utils/api.js';

// Notes panel state
let isNotesOpen = false;
let currentNotes = new Map(); // Store notes by taskId_subtaskId or taskId
let isFullScreen = false;

// Create notes panel HTML
function createNotesPanel() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'notes-overlay';
    document.body.appendChild(overlay);

    // Create panel
    const panel = document.createElement('div');
    panel.id = 'notes-panel';
    panel.innerHTML = `
        <div class="panel-content">
            <!-- Header -->
            <div class="panel-header">
                <h2 class="text-lg font-semibold dark:text-white">Task Notes</h2>
                <div class="flex items-center space-x-2">
                    <button id="toggle-fullscreen" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button id="close-notes-panel" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <!-- Search -->
            <div class="search-container">
                <input type="text" 
                       id="notes-search" 
                       placeholder="Search notes..." 
                       class="dark:placeholder-gray-500">
            </div>
            <!-- Notes List -->
            <div id="notes-tasks-list" class="flex-1 overflow-y-auto">
                <!-- Notes will be dynamically inserted here -->
            </div>
        </div>
    `;
    document.body.appendChild(panel);
    return { panel, overlay };
}

// Initialize notes functionality
export function initializeNotes() {
    // Create and append the notes panel
    const { panel: notesPanel, overlay } = createNotesPanel();
    
    // Set up event listeners
    setupNotesEventListeners(notesPanel, overlay);

    // Handle page load if we're on the notes page
    if (window.location.hash === '#notes') {
        // Check if tasks are loaded every 100ms for up to 3 seconds
        let attempts = 0;
        const checkTasks = setInterval(() => {
            const currentTasks = window.currentTasks || [];
            if (currentTasks.length > 0 || attempts >= 30) {
                clearInterval(checkTasks);
                if (currentTasks.length > 0) {
                    renderNotesPage();
                }
            }
            attempts++;
        }, 100);
    }
}

// Set up notes event listeners
function setupNotesEventListeners(notesPanel, overlay) {
    const toggleButton = document.getElementById('toggle-notes');
    const closeButton = notesPanel.querySelector('#close-notes-panel');
    const searchInput = notesPanel.querySelector('#notes-search');
    const fullscreenButton = notesPanel.querySelector('#toggle-fullscreen');

    if (!toggleButton || !closeButton || !searchInput || !fullscreenButton) {
        console.error('Notes elements not found');
        return;
    }

    // Toggle notes panel
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePanel(true);
    });

    // Close notes panel
    closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePanel(false);
    });

    // Toggle fullscreen mode
    fullscreenButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFullScreen();
    });

    // Close panel when clicking overlay
    overlay.addEventListener('click', () => {
        togglePanel(false);
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterNotesList(searchTerm);
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isNotesOpen) {
            if (isFullScreen) {
                toggleFullScreen();
            } else {
                togglePanel(false);
            }
        }
    });
}

// Initialize notes page in the sidebar
function initializeNotesPage() {
    const notesContainer = document.getElementById('notes-container');
    if (!notesContainer) {
        console.error('Notes container not found');
        return;
    }

    // Add page header
    notesContainer.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Notes</h2>
            <div class="flex items-center space-x-4 mb-6">
                <div class="flex-1">
                    <input type="text" 
                           id="notes-page-search" 
                           placeholder="Search notes..." 
                           class="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                </div>
            </div>
        </div>
        <div id="notes-page-content" class="space-y-6">
            <!-- Notes will be dynamically inserted here -->
        </div>
    `;

    // Add search functionality
    const searchInput = document.getElementById('notes-page-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterNotesPage(searchTerm);
        });
    }

    // Render notes
    renderNotesPage();
}

// Filter notes on the notes page
function filterNotesPage(searchTerm) {
    const notesContent = document.getElementById('notes-page-content');
    if (!notesContent) return;

    const noteCards = notesContent.querySelectorAll('.note-task-card');
    noteCards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const content = card.querySelector('textarea')?.value.toLowerCase() || '';
        const subtaskTitles = Array.from(card.querySelectorAll('h4'))
            .map(el => el.textContent.toLowerCase());
        const subtaskContents = Array.from(card.querySelectorAll('.subtask-note textarea'))
            .map(el => el.value.toLowerCase());

        const matchesSearch = 
            title.includes(searchTerm) || 
            content.includes(searchTerm) ||
            subtaskTitles.some(t => t.includes(searchTerm)) ||
            subtaskContents.some(c => c.includes(searchTerm));

        card.style.display = matchesSearch ? 'block' : 'none';
    });
}

// Render notes list in popup
export function renderNotesList(tasks = []) {
    const notesList = document.getElementById('notes-tasks-list');
    if (!notesList) return;

    notesList.innerHTML = '';

    tasks.forEach(task => {
        const taskNoteId = `task_${task.id}`;
        const taskNote = task.taskNotes && task.taskNotes.length > 0 ? task.taskNotes[0] : null;
        
        const taskElement = document.createElement('div');
        taskElement.className = 'note-task-card';
        taskElement.innerHTML = `
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold dark:text-white">
                        <i class="fas fa-tasks mr-2"></i>${task.title}
                    </h3>
                    <div class="flex items-center space-x-2">
                        <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                data-note-id="${taskNoteId}">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="delete-note text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                data-note-id="${taskNoteId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="relative">
                    <textarea
                        class="note-textarea w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        rows="3"
                        placeholder="Add a note for this task..."
                        data-note-id="${taskNoteId}"
                    >${taskNote ? taskNote.content || '' : ''}</textarea>
                    <button class="save-note absolute top-2 right-2" data-note-id="${taskNoteId}">
                        <i class="fas fa-save"></i>
                    </button>
                </div>
            </div>
        `;

        // Add subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
            const subtasksContainer = document.createElement('div');
            subtasksContainer.className = 'space-y-4 ml-6';
            
            task.subtasks.forEach(subtask => {
                const subtaskNoteId = `task_${task.id}_subtask_${subtask.id}`;
                const subtaskNote = subtask.subtaskNotes && subtask.subtaskNotes.length > 0 ? subtask.subtaskNotes[0] : null;
                
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-note';
                subtaskElement.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-md font-medium dark:text-white">
                            <i class="fas fa-check-circle text-sm mr-2"></i>
                            ${subtask.title}
                        </h4>
                        <div class="flex items-center space-x-2">
                            <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    data-note-id="${subtaskNoteId}">
                                <i class="fas fa-expand"></i>
                            </button>
                            <button class="delete-note text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    data-note-id="${subtaskNoteId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="relative">
                        <textarea
                            class="note-textarea w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            rows="2"
                            placeholder="Add a note for this subtask..."
                            data-note-id="${subtaskNoteId}"
                        >${subtaskNote ? subtaskNote.content || '' : ''}</textarea>
                        <button class="save-note absolute top-2 right-2" data-note-id="${subtaskNoteId}">
                            <i class="fas fa-save"></i>
                        </button>
                    </div>
                `;
                subtasksContainer.appendChild(subtaskElement);
            });
            
            taskElement.appendChild(subtasksContainer);
        }

        notesList.appendChild(taskElement);
    });

    // Add event listeners
    addNotesEventListeners(notesList);
}

// Filter notes list based on search term
function filterNotesList(searchTerm) {
    const allNoteElements = document.querySelectorAll('#notes-tasks-list > div');
    
    allNoteElements.forEach(element => {
        const title = element.querySelector('h3')?.textContent.toLowerCase() || '';
        const content = element.querySelector('textarea')?.value.toLowerCase() || '';
        const subtaskTitles = Array.from(element.querySelectorAll('h4'))
            .map(el => el.textContent.toLowerCase());
        const subtaskContents = Array.from(element.querySelectorAll('.subtask-note textarea'))
            .map(el => el.value.toLowerCase());

        const matchesSearch = 
            title.includes(searchTerm) || 
            content.includes(searchTerm) ||
            subtaskTitles.some(t => t.includes(searchTerm)) ||
            subtaskContents.some(c => c.includes(searchTerm));

        element.style.display = matchesSearch ? 'block' : 'none';
    });
}

// Load notes from API
export async function loadNotes() {
    try {
        // Get current tasks from the global tasks variable
        const currentTasks = window.currentTasks || [];
        
        // Load notes for each task and its subtasks
        for (const task of currentTasks) {
            // Load task notes
            if (task.taskNotes && task.taskNotes.length > 0) {
                currentNotes.set(`task_${task.id}`, task.taskNotes[0]);
            }

            // Load subtask notes if any
            if (task.subtasks && task.subtasks.length > 0) {
                for (const subtask of task.subtasks) {
                    if (subtask.subtaskNotes && subtask.subtaskNotes.length > 0) {
                        currentNotes.set(`task_${task.id}_subtask_${subtask.id}`, subtask.subtaskNotes[0]);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

// Save note
async function saveNote(noteId, content) {
    try {
        const [type, taskId, subType, subtaskId] = noteId.split('_');
        let savedNote;
        
        if (subType === 'subtask') {
            // Handle subtask note
            const existingNote = currentNotes.get(noteId);
            if (existingNote && existingNote.id) {
                // Update existing note
                savedNote = await API.notes.update(existingNote.id, content);
                currentNotes.set(noteId, savedNote);
            } else {
                // Create new subtask note
                savedNote = await API.notes.createSubtaskNote(parseInt(taskId), parseInt(subtaskId), content);
                currentNotes.set(noteId, savedNote);
            }
        } else {
            // Handle task note
            const existingNote = currentNotes.get(noteId);
            if (existingNote && existingNote.id) {
                // Update existing note
                savedNote = await API.notes.update(existingNote.id, content);
                currentNotes.set(noteId, savedNote);
            } else {
                // Create new task note
                savedNote = await API.notes.createTaskNote(parseInt(taskId), content);
                currentNotes.set(noteId, savedNote);
            }
        }

        // Show save confirmation
        const button = document.querySelector(`button[data-note-id="${noteId}"]`);
        if (button) {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check text-green-500"></i>';
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 1000);
        }

        return savedNote;
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
        throw error;
    }
}

// Delete note
async function deleteNote(noteId) {
    try {
        const note = currentNotes.get(noteId);
        if (note && note.id) {
            await API.notes.delete(note.id);
            currentNotes.delete(noteId);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
        throw error;
    }
}

// Update notes list with current tasks
export function updateNotesList(tasks) {
    renderNotesList(tasks);
} 

// Toggle panel visibility
function togglePanel(shouldOpen) {
    const notesPanel = document.getElementById('notes-panel');
    const overlay = document.querySelector('.notes-overlay');
    if (!notesPanel || !overlay) return;

    isNotesOpen = shouldOpen;
    
    if (shouldOpen) {
        overlay.classList.add('visible');
        notesPanel.classList.add('visible');
        // Get current tasks from the global tasks variable
        const currentTasks = window.currentTasks || [];
        renderNotesList(currentTasks);
    } else {
        overlay.classList.remove('visible');
        notesPanel.classList.remove('visible');
    }
}

function toggleFullScreen() {
    const notesPanel = document.getElementById('notes-panel');
    const fullscreenButton = notesPanel.querySelector('#toggle-fullscreen i');
    
    isFullScreen = !isFullScreen;
    
    if (isFullScreen) {
        notesPanel.classList.add('fullscreen');
        fullscreenButton.classList.remove('fa-expand');
        fullscreenButton.classList.add('fa-compress');
    } else {
        notesPanel.classList.remove('fullscreen');
        fullscreenButton.classList.remove('fa-compress');
        fullscreenButton.classList.add('fa-expand');
    }
}

function openFullScreenNote(noteId, content) {
    const notesPanel = document.getElementById('notes-panel');
    if (!notesPanel) return;

    // Get the current note
    const note = currentNotes.get(noteId);
    const noteContent = note ? note.content || '' : '';

    // Save current content
    const currentContent = notesPanel.innerHTML;
    
    // Update panel with single note view
    notesPanel.innerHTML = `
        <div class="panel-content">
            <div class="panel-header">
                <h2 class="text-lg font-semibold dark:text-white">Edit Note</h2>
                <button id="back-to-notes" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4">
                <textarea
                    class="w-full h-full px-4 py-3 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    style="min-height: 300px;"
                    placeholder="Enter your note..."
                >${noteContent}</textarea>
            </div>
            <div class="panel-footer">
                <button id="save-fullscreen-note" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Save Note
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    const backButton = notesPanel.querySelector('#back-to-notes');
    const saveButton = notesPanel.querySelector('#save-fullscreen-note');
    const textarea = notesPanel.querySelector('textarea');

    backButton.addEventListener('click', () => {
        notesPanel.innerHTML = currentContent;
        // Re-initialize event listeners
        const closeButton = notesPanel.querySelector('#close-notes-panel');
        const searchInput = notesPanel.querySelector('#notes-search');
        const fullscreenButton = notesPanel.querySelector('#toggle-fullscreen');
        
        // Reattach event listeners
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePanel(false);
        });

        fullscreenButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFullScreen();
        });

        searchInput.addEventListener('input', (e) => {
            filterNotesList(e.target.value.toLowerCase());
        });
    });

    saveButton.addEventListener('click', async () => {
        await saveNote(noteId, textarea.value);
        backButton.click(); // Return to main view
    });
} 

// Add event listeners to notes elements
function addNotesEventListeners(container) {
    // Save buttons
    container.querySelectorAll('.save-note').forEach(button => {
        button.addEventListener('click', async () => {
            const noteId = button.dataset.noteId;
            const textarea = container.querySelector(`textarea[data-note-id="${noteId}"]`);
            try {
                await saveNote(noteId, textarea.value);
                // Show success message
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check text-green-500"></i>';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                }, 1000);
            } catch (error) {
                console.error('Error saving note:', error);
                alert('Failed to save note. Please try again.');
            }
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete-note').forEach(button => {
        button.addEventListener('click', async () => {
            const noteId = button.dataset.noteId;
            if (confirm('Are you sure you want to delete this note?')) {
                try {
                    await deleteNote(noteId);
                    // Refresh the notes display
                    if (window.location.hash === '#notes') {
                        renderNotesPage();
                    } else {
                        const currentTasks = window.currentTasks || [];
                        renderNotesList(currentTasks);
                    }
                } catch (error) {
                    console.error('Error deleting note:', error);
                    alert('Failed to delete note. Please try again.');
                }
            }
        });
    });

    // Expand buttons
    container.querySelectorAll('.expand-note').forEach(button => {
        button.addEventListener('click', () => {
            const noteId = button.dataset.noteId;
            const textarea = container.querySelector(`textarea[data-note-id="${noteId}"]`);
            openFullScreenNote(noteId, textarea.value);
        });
    });

    // Auto-save on textarea change
    container.querySelectorAll('.note-textarea').forEach(textarea => {
        textarea.addEventListener('blur', async () => {
            const noteId = textarea.dataset.noteId;
            try {
                await saveNote(noteId, textarea.value);
            } catch (error) {
                console.error('Error auto-saving note:', error);
            }
        });
    });
} 

// Render notes in the sidebar page
export async function renderNotesPage() {
    const notesContent = document.getElementById('notes-page-content');
    if (!notesContent) return;

    // Get current tasks from the global tasks variable
    const currentTasks = window.currentTasks || [];
    
    // If no tasks are loaded yet, try to wait for them
    if (currentTasks.length === 0) {
        // Wait up to 3 seconds for tasks to load
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const tasks = window.currentTasks || [];
            if (tasks.length > 0) {
                renderNotesContent(notesContent, tasks);
                return;
            }
        }
    }
    
    // Render the notes using the shared function
    renderNotesContent(notesContent, currentTasks);
}

// Shared rendering function for both popup and page
function renderNotesContent(container, tasks) {
    if (!container) return;

    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-sticky-note text-4xl mb-4"></i>
                <p>No tasks found. Create a task to add notes.</p>
            </div>
        `;
        return;
    }

    const notesView = document.createElement('div');
    notesView.className = 'space-y-6';

    tasks.forEach(task => {
        const taskNoteId = `task_${task.id}`;
        const taskNote = task.taskNotes && task.taskNotes.length > 0 ? task.taskNotes[0] : null;
        
        const taskElement = document.createElement('div');
        taskElement.className = 'note-task-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4';
        taskElement.innerHTML = `
            <div class="mb-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-semibold dark:text-white">
                        <i class="fas fa-tasks mr-2"></i>${task.title}
                    </h3>
                    <div class="flex items-center space-x-2">
                        <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                data-note-id="${taskNoteId}">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="delete-note text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                data-note-id="${taskNoteId}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="relative">
                    <textarea
                        class="note-textarea w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows="4"
                        placeholder="Add a note for this task..."
                        data-note-id="${taskNoteId}"
                    >${taskNote ? taskNote.content || '' : ''}</textarea>
                    <button class="save-note absolute top-3 right-3" data-note-id="${taskNoteId}">
                        <i class="fas fa-save"></i>
                    </button>
                </div>
            </div>
        `;

        // Add subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
            const subtasksContainer = document.createElement('div');
            subtasksContainer.className = 'space-y-4 ml-8 mt-4';
            
            task.subtasks.forEach(subtask => {
                const subtaskNoteId = `task_${task.id}_subtask_${subtask.id}`;
                const subtaskNote = subtask.subtaskNotes && subtask.subtaskNotes.length > 0 ? subtask.subtaskNotes[0] : null;
                
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-note bg-gray-50 dark:bg-gray-700 rounded-lg p-4';
                subtaskElement.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-lg font-medium dark:text-white">
                            <i class="fas fa-check-circle text-sm mr-2"></i>
                            ${subtask.title}
                        </h4>
                        <div class="flex items-center space-x-2">
                            <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    data-note-id="${subtaskNoteId}">
                                <i class="fas fa-expand"></i>
                            </button>
                            <button class="delete-note text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    data-note-id="${subtaskNoteId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="relative">
                        <textarea
                            class="note-textarea w-full px-4 py-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows="3"
                            placeholder="Add a note for this subtask..."
                            data-note-id="${subtaskNoteId}"
                        >${subtaskNote ? subtaskNote.content || '' : ''}</textarea>
                        <button class="save-note absolute top-3 right-3" data-note-id="${subtaskNoteId}">
                            <i class="fas fa-save"></i>
                        </button>
                    </div>
                `;
                subtasksContainer.appendChild(subtaskElement);
            });
            
            taskElement.appendChild(subtasksContainer);
        }

        notesView.appendChild(taskElement);
    });

    container.appendChild(notesView);
    addNotesEventListeners(container);
} 