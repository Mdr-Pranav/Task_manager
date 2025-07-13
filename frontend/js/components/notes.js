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
    console.log('Initializing notes...'); // Debug log
    
    // Load notes from localStorage
    loadNotes();
    console.log('Loaded notes:', currentNotes); // Debug log
    
    const toggleButton = document.getElementById('toggle-notes');
    if (!toggleButton) {
        console.error('Toggle button not found');
        return;
    }

    // Create and append the notes panel
    const { panel: notesPanel, overlay } = createNotesPanel();
    const closeButton = notesPanel.querySelector('#close-notes-panel');
    const searchInput = notesPanel.querySelector('#notes-search');
    const fullscreenButton = notesPanel.querySelector('#toggle-fullscreen');

    if (!closeButton || !searchInput || !fullscreenButton) {
        console.error('Notes elements not found:', { closeButton, searchInput, fullscreenButton });
        return;
    }

    console.log('Notes elements found, setting up event listeners...'); // Debug log

    // Toggle notes panel
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle button clicked'); // Debug log
        togglePanel(true);
    });

    // Close notes panel
    closeButton.addEventListener('click', (e) => {
        console.log('Close button clicked'); // Debug log
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

    // Initialize notes page
    initializeNotesPage();
}

// Initialize notes page in the sidebar
function initializeNotesPage() {
    const notesContainer = document.getElementById('notes-container');
    if (!notesContainer) return;

    // Render all notes in the container
    renderNotesPage();
}

// Render notes in the sidebar page
function renderNotesPage() {
    const notesContainer = document.getElementById('notes-container');
    if (!notesContainer) return;

    // Load notes from localStorage
    loadNotes();
    console.log('Loaded notes for page:', currentNotes); // Debug log

    // Get current tasks from the global tasks variable
    const currentTasks = window.currentTasks || [];
    
    // Clear existing content
    notesContainer.innerHTML = '';
    
    // Create notes view
    const notesView = document.createElement('div');
    notesView.className = 'space-y-6';
    
    currentTasks.forEach(task => {
        const taskNoteId = `task_${task.id}`;
        const taskNote = currentNotes.get(taskNoteId) || '';
        
        const taskElement = document.createElement('div');
        taskElement.className = 'note-task-card bg-white dark:bg-gray-700 rounded-lg shadow-md p-4';
        taskElement.innerHTML = `
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold dark:text-white">${task.title}</h3>
                    <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            data-note-id="${taskNoteId}">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
                <div class="relative">
                    <textarea
                        class="note-textarea w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        rows="3"
                        placeholder="Add a note for this task..."
                        data-note-id="${taskNoteId}"
                    >${taskNote}</textarea>
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
                const subtaskNote = currentNotes.get(subtaskNoteId) || '';
                
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-note';
                subtaskElement.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-md font-medium dark:text-white">
                            <i class="fas fa-tasks text-sm mr-2"></i>
                            ${subtask.title}
                        </h4>
                        <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                data-note-id="${subtaskNoteId}">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                    <div class="relative">
                        <textarea
                            class="note-textarea w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            rows="2"
                            placeholder="Add a note for this subtask..."
                            data-note-id="${subtaskNoteId}"
                        >${subtaskNote}</textarea>
                        <button class="save-note absolute top-2 right-2" data-note-id="${subtaskNoteId}">
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
    
    notesContainer.appendChild(notesView);

    // Add event listeners
    addNotesEventListeners(notesContainer);
}

function addNotesEventListeners(container) {
    // Save buttons
    container.querySelectorAll('.save-note').forEach(button => {
        button.addEventListener('click', () => {
            const noteId = button.dataset.noteId;
            const textarea = container.querySelector(`textarea[data-note-id="${noteId}"]`);
            saveNote(noteId, textarea.value);
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
}

function togglePanel(shouldOpen) {
    const notesPanel = document.getElementById('notes-panel');
    const overlay = document.querySelector('.notes-overlay');
    if (!notesPanel || !overlay) return;

    isNotesOpen = shouldOpen;
    
    if (shouldOpen) {
        overlay.classList.add('visible');
        notesPanel.classList.add('visible');
        // Load notes from localStorage
        loadNotes();
        // Get current tasks from the global tasks variable
        const currentTasks = window.currentTasks || [];
        console.log('Current tasks:', currentTasks); // Debug log
        console.log('Current notes:', currentNotes); // Debug log
        renderNotesList(currentTasks);
    } else {
        overlay.classList.remove('visible');
        notesPanel.classList.remove('visible');
    }
}

// Render notes list
export function renderNotesList(tasks = []) {
    // Load notes from localStorage
    loadNotes();
    console.log('Loaded notes for list:', currentNotes); // Debug log

    const notesList = document.getElementById('notes-tasks-list');
    notesList.innerHTML = '';

    tasks.forEach(task => {
        const taskNoteId = `task_${task.id}`;
        const taskNote = currentNotes.get(taskNoteId) || '';
        
        const taskElement = document.createElement('div');
        taskElement.className = 'note-task-card';
        taskElement.innerHTML = `
            <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold dark:text-white">${task.title}</h3>
                    <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            data-note-id="${taskNoteId}">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
                <div class="relative">
                    <textarea
                        class="note-textarea w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        rows="3"
                        placeholder="Add a note for this task..."
                        data-note-id="${taskNoteId}"
                    >${taskNote}</textarea>
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
                const subtaskNote = currentNotes.get(subtaskNoteId) || '';
                
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-note';
                subtaskElement.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-md font-medium dark:text-white">
                            <i class="fas fa-tasks text-sm mr-2"></i>
                            ${subtask.title}
                        </h4>
                        <button class="expand-note text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                data-note-id="${subtaskNoteId}">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                    <div class="relative">
                        <textarea
                            class="note-textarea w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            rows="2"
                            placeholder="Add a note for this subtask..."
                            data-note-id="${subtaskNoteId}"
                        >${subtaskNote}</textarea>
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

    // Add event listeners for save buttons and expand buttons
    const container = document.getElementById('notes-tasks-list');
    addNotesEventListeners(container);
}

// Filter notes list based on search term
function filterNotesList(searchTerm) {
    const allNoteElements = document.querySelectorAll('#notes-tasks-list > div');
    
    allNoteElements.forEach(element => {
        const title = element.querySelector('h3').textContent.toLowerCase();
        const subtaskTitles = Array.from(element.querySelectorAll('h4'))
            .map(el => el.textContent.toLowerCase());
        
        const matchesSearch = title.includes(searchTerm) || 
            subtaskTitles.some(st => st.includes(searchTerm));
        
        element.style.display = matchesSearch ? 'block' : 'none';
    });
}

// Save note
function saveNote(noteId, content) {
    currentNotes.set(noteId, content);
    
    // Save to localStorage for persistence
    localStorage.setItem('taskNotes', JSON.stringify(Array.from(currentNotes.entries())));
    
    // Show save confirmation
    const button = document.querySelector(`button[data-note-id="${noteId}"]`);
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check text-green-500"></i>';
    setTimeout(() => {
        button.innerHTML = originalHTML;
    }, 1000);
}

// Load notes from localStorage
export function loadNotes() {
    const savedNotes = localStorage.getItem('taskNotes');
    if (savedNotes) {
        currentNotes = new Map(JSON.parse(savedNotes));
    }
}

// Update notes list with current tasks
export function updateNotesList(tasks) {
    renderNotesList(tasks);
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
                >${content}</textarea>
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

    saveButton.addEventListener('click', () => {
        saveNote(noteId, textarea.value);
        backButton.click(); // Return to main view
    });
} 