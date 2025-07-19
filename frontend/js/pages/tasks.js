import { createTaskStatusChart, createTaskPriorityChart, updateChartTheme } from '../components/charts.js';
import { initializeNotes, loadNotes, updateNotesList } from '../components/notes.js';
import API from '../utils/api.js';

let tasks = [];
let categories = [];
let filteredTasks = [];
let statusChart = null;
let priorityChart = null;

// Initialize tasks page
export function initializeTasks() {
    renderTasksPage();
    setupEventListeners();
    fetchTasks();
    fetchCategories();
}

// Setup event listeners
function setupEventListeners() {
    // Add Task button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.classList.remove('hidden');
        addTaskBtn.addEventListener('click', () => showTaskModal());
    }

    // Setup filter listeners
    setupFilters();

    // Setup modal listeners
    const taskForm = document.querySelector('#task-form');
    const taskModal = document.querySelector('#task-modal');
    const subtaskForm = document.querySelector('#subtask-form');
    const subtaskModal = document.querySelector('#subtask-modal');
    const closeTaskModalBtn = document.querySelector('#close-task-modal-btn');
    const closeSubtaskModalBtn = document.querySelector('#close-subtask-modal-btn');
    const addSubtaskBtn = document.querySelector('#add-subtask-btn');

    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    if (subtaskForm) {
        subtaskForm.addEventListener('submit', handleSubtaskSubmit);
    }

    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            taskModal.classList.add('hidden');
        });
    }

    if (closeSubtaskModalBtn) {
        closeSubtaskModalBtn.addEventListener('click', () => {
            subtaskModal.classList.add('hidden');
        });
    }

    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                taskModal.classList.add('hidden');
            }
        });
    }

    if (subtaskModal) {
        subtaskModal.addEventListener('click', (e) => {
            if (e.target === subtaskModal) {
                subtaskModal.classList.add('hidden');
            }
        });
    }

    if (addSubtaskBtn) {
        addSubtaskBtn.addEventListener('click', () => {
            const taskId = document.querySelector('#task-form').dataset.taskId;
            if (taskId) {
                showAddSubtaskModal(taskId);
            }
        });
    }

    // Add event delegation for task actions
    document.addEventListener('click', async (e) => {
        const target = e.target;

        // Handle task expansion
        const toggleBtn = target.closest('.toggle-subtasks');
        if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskCard = toggleBtn.closest('.task-card');
            const chevron = toggleBtn.querySelector('.fa-chevron-right');
            const subtasksSection = taskCard.querySelector('.subtasks-section');
            
            if (subtasksSection) {
                const isHidden = subtasksSection.classList.contains('hidden');
                subtasksSection.classList.toggle('hidden');
                
                if (chevron) {
                    chevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
                }
            }
            return;
        }

        // Handle add subtask button
        const addSubtaskBtn = target.closest('.add-subtask-btn');
        if (addSubtaskBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = addSubtaskBtn.getAttribute('data-task-id');
            if (taskId) {
                showAddSubtaskModal(taskId);
            }
            return;
        }

        // Handle subtask checkbox clicks
        if (target.classList.contains('subtask-checkbox')) {
            console.log('Subtask checkbox clicked');
            const taskId = parseInt(target.getAttribute('data-task-id'));
            const subtaskId = parseInt(target.getAttribute('data-subtask-id'));
            
            console.log('Task ID:', taskId, 'Subtask ID:', subtaskId);
            
            if (isNaN(taskId) || isNaN(subtaskId)) {
                console.error('Invalid task or subtask ID:', { taskId, subtaskId });
                return;
            }
            
            await toggleSubtask(taskId, subtaskId);
            return;
        }

        // Handle subtask delete button clicks
        const deleteSubtaskBtn = target.closest('.delete-subtask-btn');
        if (deleteSubtaskBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = parseInt(deleteSubtaskBtn.getAttribute('data-task-id'));
            const subtaskId = parseInt(deleteSubtaskBtn.getAttribute('data-subtask-id'));
            
            if (isNaN(taskId) || isNaN(subtaskId)) {
                console.error('Invalid task or subtask ID:', { taskId, subtaskId });
                return;
            }
            
            if (confirm('Are you sure you want to delete this subtask?')) {
                await deleteSubtask(taskId, subtaskId);
            }
            return;
        }

        // Handle task delete button clicks
        const deleteTaskBtn = target.closest('.delete-task-btn');
        if (deleteTaskBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = parseInt(deleteTaskBtn.getAttribute('data-task-id'));
            
            if (isNaN(taskId)) {
                console.error('Invalid task ID:', taskId);
                return;
            }
            
            if (confirm('Are you sure you want to delete this task and all its subtasks?')) {
                await deleteTask(taskId);
            }
            return;
        }

        // Handle task move button clicks
        const moveTaskBtn = target.closest('.move-task-btn');
        if (moveTaskBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = parseInt(moveTaskBtn.getAttribute('data-task-id'));
            const direction = moveTaskBtn.getAttribute('data-direction');
            
            if (isNaN(taskId) || !direction) {
                console.error('Invalid task ID or direction:', { taskId, direction });
                return;
            }
            
            await moveTask(taskId, direction);
            return;
        }
    });
}

// Setup filters
function setupFilters() {
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const categoryFilter = document.getElementById('category-filter');

    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    if (priorityFilter) {
        priorityFilter.addEventListener('change', applyFilters);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('status-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;

    filteredTasks = tasks.filter(task => {
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || task.categoryId === parseInt(categoryFilter);
        return matchesStatus && matchesPriority && matchesCategory;
    });

    renderTasks();
    updateCharts();
}

// Fetch tasks from API
async function fetchTasks() {
    try {
        console.log('Fetching tasks...');
        // Get tasks from API
        const response = await API.tasks.getAll();
        tasks = Array.isArray(response) ? response : [];
        
        // Ensure all tasks have a position
        tasks = tasks.map((task, index) => ({
            ...task,
            position: task.position || index
        }));

        // Sort tasks by position
        tasks.sort((a, b) => (a.position || 0) - (b.position || 0));

        filteredTasks = [...tasks];
        window.currentTasks = tasks;
        
        console.log('Tasks fetched:', tasks);
        await renderTasks();
        updateCharts();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('Error loading tasks. Please refresh the page.');
        tasks = [];
        filteredTasks = [];
        window.currentTasks = [];
        renderTasks();
    }
}

// Fetch categories
async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        categories = Array.isArray(data) ? data : [];
        populateCategoryFilter();
        populateCategorySelects();
    } catch (error) {
        console.error('Error fetching categories:', error);
        categories = [];
        populateCategoryFilter(); // Still populate to show empty state
    }
}

// Populate category filter
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="all">All</option>' +
        (categories || []).map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
}

// Calculate progress for a task
function calculateProgress(subtasks) {
    if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
        return 0;
    }
    console.log('Calculating progress for subtasks:', subtasks);
    console.log('Subtasks completion status:', subtasks.map(s => ({ id: s.id, completed: s.completed })));
    const completedSubtasks = subtasks.filter(subtask => subtask.completed === true).length;
    console.log('Number of completed subtasks:', completedSubtasks);
    const progress = Math.round((completedSubtasks / subtasks.length) * 100);
    console.log('Progress calculated:', progress + '%');
    return progress;
}

// Get status class for styling
function getStatusClass(status) {
    const classes = {
        'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return classes[status] || classes.todo;
}

// Get priority class for styling
function getPriorityClass(priority) {
    const classes = {
        'low': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        'medium': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return classes[priority] || classes.medium;
}

// Render tasks
function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No tasks found</p>
            </div>
        `;
        return;
    }

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    filteredTasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 overflow-hidden';
        taskElement.dataset.taskId = task.id;
        
        const progress = calculateProgress(task.subtasks);
        const statusClass = getStatusClass(task.status);
        const priorityClass = getPriorityClass(task.priority);
        
        taskElement.innerHTML = `
            <div class="task-header p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="flex flex-col space-y-1">
                            ${index > 0 ? `
                                <button class="move-task-btn text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        data-task-id="${task.id}" data-direction="up">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                            ` : ''}
                            ${index < filteredTasks.length - 1 ? `
                                <button class="move-task-btn text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        data-task-id="${task.id}" data-direction="down">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            ` : ''}
                        </div>
                        <button class="toggle-subtasks flex items-center space-x-2">
                            <i class="fas fa-chevron-right transform transition-transform duration-200"></i>
                            <h3 class="text-lg font-semibold dark:text-white">${task.title}</h3>
                        </button>
                        ${task.category ? 
                            `<span class="category-tag px-2 py-1 rounded text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                ${task.category.name}
                            </span>` : 
                            ''
                        }
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="status-badge ${statusClass} px-2 py-1 rounded text-sm">${task.status}</span>
                        <span class="priority-badge ${priorityClass} px-2 py-1 rounded text-sm">${task.priority}</span>
                        <button class="delete-task-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                data-task-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${task.description ? 
                    `<p class="text-gray-600 dark:text-gray-400 mt-2">${task.description}</p>` : 
                    ''
                }
                
                <!-- Progress Bar -->
                <div class="mt-4">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400 progress-text">${progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div class="progress-bar bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
                    </div>
                </div>

                <!-- Subtasks Section -->
                <div class="subtasks-section mt-4 hidden">
                    ${task.subtasks && task.subtasks.length > 0 ? `
                        <div class="space-y-2">
                        ${task.subtasks.map(subtask => `
                                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div class="flex items-center flex-1">
                                        <input type="checkbox" 
                                               class="subtask-checkbox w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                               data-task-id="${task.id}"
                                               data-subtask-id="${subtask.id}"
                                               ${subtask.completed === true ? 'checked' : ''}>
                                        <div class="ml-3 flex-1">
                                            <div class="text-sm font-medium text-gray-900 dark:text-gray-100 ${subtask.completed === true ? 'line-through text-gray-500 dark:text-gray-400' : ''}">${subtask.title}</div>
                                            ${subtask.description ? `
                                                <div class="text-xs text-gray-500 dark:text-gray-400 ${subtask.completed === true ? 'line-through' : ''}">${subtask.description}</div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <button class="delete-subtask-btn text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" 
                                            data-task-id="${task.id}"
                                            data-subtask-id="${subtask.id}"
                                            title="Delete Subtask">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                        `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                            <p>No subtasks yet</p>
                        </div>
                    `}
                    <button class="add-subtask-btn mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        data-task-id="${task.id}">
                        <i class="fas fa-plus mr-1"></i>Add Subtask
                    </button>
                </div>
            </div>
        `;
        
        fragment.appendChild(taskElement);
    });

    // Clear the tasks list and append the fragment
    tasksList.innerHTML = '';
    tasksList.appendChild(fragment);

    // Re-attach event listeners
    setupTaskEventListeners();
}

// Setup event listeners for tasks
function setupTaskEventListeners() {
    const tasksList = document.getElementById('tasks-list');
    if (!tasksList) return;

    // Remove any existing event listeners
    tasksList.removeEventListener('click', handleTaskClick);
    tasksList.removeEventListener('change', handleSubtaskChange);

    // Add event listeners
    tasksList.addEventListener('click', handleTaskClick);
    tasksList.addEventListener('change', (e) => {
        const target = e.target;
        console.log('Change event target:', target);
        console.log('Target classList:', target.classList);
        
        if (target.classList.contains('subtask-checkbox')) {
            console.log('Checkbox data attributes:', {
                taskId: target.getAttribute('data-task-id'),
                subtaskId: target.getAttribute('data-subtask-id'),
                checked: target.checked
            });
            handleSubtaskChange(e);
        }
    });
}

// Handle task-related click events
function handleTaskClick(e) {
    const target = e.target;
    
    // Find the closest button if clicked on an icon or the button itself
    const addSubtaskBtn = target.closest('.add-subtask-btn');
    const editTaskBtn = target.closest('.edit-task-btn');
    const deleteTaskBtn = target.closest('.delete-task-btn');
    const toggleSubtasksBtn = target.closest('.toggle-subtasks');

    if (toggleSubtasksBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const taskCard = toggleSubtasksBtn.closest('.task-card');
        const chevron = toggleSubtasksBtn.querySelector('.fa-chevron-right');
        const subtasksSection = taskCard.querySelector('.subtasks-section');
        
        if (subtasksSection) {
            const isHidden = subtasksSection.classList.contains('hidden');
            subtasksSection.classList.toggle('hidden');
            
            if (chevron) {
                chevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
            }
        }
    } else if (addSubtaskBtn) {
        const taskId = parseInt(addSubtaskBtn.dataset.taskId);
        if (!isNaN(taskId)) {
            showAddSubtaskModal(taskId);
        }
    } else if (editTaskBtn) {
        const taskId = parseInt(editTaskBtn.dataset.taskId);
        if (!isNaN(taskId)) {
            showTaskModal(taskId);
        }
    } else if (deleteTaskBtn) {
        const taskId = parseInt(deleteTaskBtn.dataset.taskId);
        if (!isNaN(taskId)) {
            deleteTask(taskId);
        }
    }
}

// Handle subtask checkbox changes
function handleSubtaskChange(e) {
    const target = e.target;
    console.log('Handling subtask change');
    if (target.classList.contains('subtask-checkbox')) {
        const taskId = parseInt(target.getAttribute('data-task-id'));
        const subtaskId = parseInt(target.getAttribute('data-subtask-id'));
        console.log('Processing subtask change:', { taskId, subtaskId, checked: target.checked });
        if (!isNaN(taskId) && !isNaN(subtaskId)) {
            // Don't prevent the default checkbox behavior
            // Let the checkbox update visually while we process the change
            toggleSubtask(taskId, subtaskId).catch(error => {
                console.error('Error in handleSubtaskChange:', error);
                // The toggleSubtask function will handle reverting the checkbox if needed
            });
        } else {
            console.error('Invalid task or subtask ID in change handler:', { taskId, subtaskId });
        }
    }
}

// Show task modal
function showTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const titleInput = form.querySelector('input[name="title"]');
    const descriptionInput = form.querySelector('textarea[name="description"]');
    const statusSelect = form.querySelector('select[name="status"]');
    const prioritySelect = form.querySelector('select[name="priority"]');
    const categorySelect = form.querySelector('select[name="category"]');
    const dueDateInput = form.querySelector('input[name="dueDate"]');
    const subtasksList = form.querySelector('#subtasks-list');

    // Reset form
    form.reset();
    form.dataset.taskId = taskId || '';

    // If editing existing task
    if (taskId) {
        const task = tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            titleInput.value = task.title;
            descriptionInput.value = task.description || '';
            statusSelect.value = task.status;
            prioritySelect.value = task.priority;
            categorySelect.value = task.categoryId || '';
            dueDateInput.value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';

            // Render existing subtasks
            if (task.subtasks && task.subtasks.length > 0) {
                subtasksList.innerHTML = task.subtasks.map(subtask => `
                    <div class="subtask-item flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded mb-2">
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" 
                                   class="subtask-checkbox form-checkbox h-5 w-5 text-blue-600"
                                   data-subtask-id="${subtask.id}"
                                   ${subtask.completed ? 'checked' : ''}>
                            <span class="text-gray-700 dark:text-gray-300">${subtask.title}</span>
                        </div>
                        <button type="button" 
                                class="delete-subtask-btn text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                data-subtask-id="${subtask.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            } else {
                subtasksList.innerHTML = '';
            }
        }
    }

    modal.classList.remove('hidden');
}

// Handle task form submission
async function handleTaskSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const taskId = form.dataset.taskId;
    
    const taskData = {
        id: taskId ? parseInt(taskId) : Date.now(), // Use timestamp as ID for new tasks
        title: form.title.value,
        description: form.description.value,
        status: form.status.value,
        priority: form.priority.value,
        dueDate: form.dueDate.value,
        categoryId: form.categoryId.value ? parseInt(form.categoryId.value) : null,
        subtasks: taskId ? (tasks.find(t => t.id === parseInt(taskId))?.subtasks || []) : [],
        createdAt: taskId ? (tasks.find(t => t.id === parseInt(taskId))?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        position: taskId ? (tasks.find(t => t.id === parseInt(taskId))?.position || tasks.length) : tasks.length
    };

    try {
        if (taskId) {
            // Update existing task
            const index = tasks.findIndex(t => t.id === parseInt(taskId));
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...taskData };
            }
        } else {
            // Add new task
            tasks.push(taskData);
        }

        // Sort tasks by position
        tasks.sort((a, b) => (a.position || 0) - (b.position || 0));

        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Close modal and refresh tasks
        document.querySelector('#task-modal').classList.add('hidden');
        await fetchTasks();
    } catch (error) {
        alert(error.message);
        console.error('Error saving task:', error);
    }
}

// Delete task
async function deleteTask(taskId) {
    try {
        // Remove task from array
        tasks = tasks.filter(t => t.id !== taskId);
        
        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));

        await fetchTasks();
    } catch (error) {
        alert(error.message);
        console.error('Error deleting task:', error);
    }
}

// Show add subtask modal
function showAddSubtaskModal(taskId) {
    const modal = document.getElementById('subtask-modal');
    const form = document.getElementById('subtask-form');
    
    // Reset form and set task ID
    form.reset();
    form.dataset.taskId = taskId;
    
    modal.classList.remove('hidden');
}

// Handle subtask form submission
async function handleSubtaskSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const taskId = parseInt(form.dataset.taskId);
    const subtaskId = form.dataset.subtaskId;

    if (!taskId) {
        console.error('No task ID provided for subtask');
        return;
    }

    const subtaskData = {
        id: subtaskId ? parseInt(subtaskId) : Date.now(), // Use timestamp as ID for new subtasks
        title: form.title.value,
        description: form.description.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    try {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        if (subtaskId) {
            // Update existing subtask
            const subtaskIndex = tasks[taskIndex].subtasks.findIndex(s => s.id === parseInt(subtaskId));
            if (subtaskIndex !== -1) {
                tasks[taskIndex].subtasks[subtaskIndex] = { ...tasks[taskIndex].subtasks[subtaskIndex], ...subtaskData };
            }
        } else {
            // Add new subtask
            if (!tasks[taskIndex].subtasks) {
                tasks[taskIndex].subtasks = [];
            }
            tasks[taskIndex].subtasks.push(subtaskData);
        }

        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Close modal and refresh tasks
        document.querySelector('#subtask-modal').classList.add('hidden');
        await fetchTasks();
    } catch (error) {
        alert(error.message);
        console.error('Error saving subtask:', error);
    }
}

// Toggle subtask completion
async function toggleSubtask(taskId, subtaskId) {
    try {
        console.log('Toggling subtask:', { taskId, subtaskId });
        
        // Find the task and subtask in the current state
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        const subtaskIndex = tasks[taskIndex].subtasks.findIndex(s => s.id === subtaskId);
        if (subtaskIndex === -1) {
            throw new Error('Subtask not found');
        }

        // Get the current completion state
        const currentState = tasks[taskIndex].subtasks[subtaskIndex].completed;
        
        try {
            // Optimistically update the UI
            tasks[taskIndex].subtasks[subtaskIndex].completed = !currentState;
            
            // Update the progress bar for this specific task
            const taskElement = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (taskElement) {
                const progress = calculateProgress(tasks[taskIndex].subtasks);
                const progressBar = taskElement.querySelector('.progress-bar');
                const progressText = taskElement.querySelector('.progress-text');
                if (progressBar && progressText) {
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                }
            }

            // Call the API to toggle the subtask
            const updatedSubtask = await API.subtasks.toggleComplete(taskId, subtaskId);
            console.log('Subtask updated from API:', updatedSubtask);

            // Verify the state matches the server response
            if (tasks[taskIndex].subtasks[subtaskIndex].completed !== updatedSubtask.completed) {
                // If there's a mismatch, update to match server state
                tasks[taskIndex].subtasks[subtaskIndex].completed = updatedSubtask.completed;
                await renderTasks();
            }

            // Update filteredTasks to match the change
            const filteredTaskIndex = filteredTasks.findIndex(t => t.id === taskId);
            if (filteredTaskIndex !== -1) {
                filteredTasks[filteredTaskIndex] = tasks[taskIndex];
            }
        } catch (error) {
            // If the API call fails, revert the local state
            tasks[taskIndex].subtasks[subtaskIndex].completed = currentState;
            
            // Revert the checkbox state in the UI
            const checkbox = document.querySelector(`input[data-task-id="${taskId}"][data-subtask-id="${subtaskId}"]`);
            if (checkbox) {
                checkbox.checked = currentState;
            }

            // Update the progress bar back to the original state
            const taskElement = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
            if (taskElement) {
                const progress = calculateProgress(tasks[taskIndex].subtasks);
                const progressBar = taskElement.querySelector('.progress-bar');
                const progressText = taskElement.querySelector('.progress-text');
                if (progressBar && progressText) {
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                }
            }

            console.error('Failed to update subtask on server:', error);
            alert('Failed to update subtask. Please try again.');
        }
    } catch (error) {
        console.error('Error in toggleSubtask:', error);
        alert('An error occurred while updating the subtask.');
    }
}

// Delete subtask
async function deleteSubtask(taskId, subtaskId) {
    try {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }

        // Remove subtask from array
        tasks[taskIndex].subtasks = tasks[taskIndex].subtasks.filter(s => s.id !== subtaskId);

        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Re-render tasks to update progress bar and subtask display
        renderTasks();
    } catch (error) {
        alert(error.message);
        console.error('Error deleting subtask:', error);
    }
}

// Update charts
function updateCharts() {
    if (!Array.isArray(filteredTasks)) return;

    if (statusChart) {
        statusChart.destroy();
    }
    if (priorityChart) {
        priorityChart.destroy();
    }

    statusChart = createTaskStatusChart(filteredTasks);
    priorityChart = createTaskPriorityChart(filteredTasks);

    // Update chart themes based on current mode
    if (document.documentElement.classList.contains('dark')) {
        updateChartTheme(statusChart);
        updateChartTheme(priorityChart);
    }
}

// Populate category selects
function populateCategorySelects() {
    const categorySelects = document.querySelectorAll('select[name="categoryId"]');
    categorySelects.forEach(select => {
        select.innerHTML = '<option value="">None</option>' +
            categories.map(category => 
                `<option value="${category.id}">${category.name}</option>`
            ).join('');
    });
}

// Move task up or down in the list
async function moveTask(taskId, direction) {
    console.log('Moving task:', { taskId, direction });
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        console.error('Task not found:', taskId);
        return;
    }

    let swapIndex;
    if (direction === 'up' && taskIndex > 0) {
        swapIndex = taskIndex - 1;
    } else if (direction === 'down' && taskIndex < tasks.length - 1) {
        swapIndex = taskIndex + 1;
    } else {
        console.log('No valid move possible:', { taskIndex, direction, tasksLength: tasks.length });
        return;
    }

    try {
        // Get the positions
        const newPosition = tasks[swapIndex].position;
        const oldPosition = tasks[taskIndex].position;
        
        console.log('Swapping positions:', {
            taskId,
            oldPosition,
            newPosition,
            swapWithTaskId: tasks[swapIndex].id
        });

        // Update the moved task's position in the backend
        const updatedTask = await API.tasks.updatePosition(taskId, newPosition);
        console.log('Task position updated:', updatedTask);

        // Refresh the tasks list to get the updated order
        await fetchTasks();
        
        // Re-apply any active filters
        applyFilters();

        console.log('Tasks refreshed after move');
    } catch (error) {
        console.error('Error reordering tasks:', error);
        alert('Error reordering tasks. Please try again.');
        
        // Refresh tasks to ensure UI is in sync with server
        await fetchTasks();
    }
}

// Render tasks page
function renderTasksPage() {
    const mainContent = document.querySelector('#tasks-page');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <!-- Filters -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select id="status-filter" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select id="priority-filter" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select id="category-filter" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="all">All</option>
                    ${categories.map(category => `
                        <option value="${category.id}">${category.name}</option>
                    `).join('')}
                </select>
            </div>
        </div>

        <!-- Tasks List -->
        <div id="tasks-list" class="space-y-4">
            <!-- Tasks will be dynamically inserted here -->
        </div>
    `;

    // Setup event listeners for filters
    setupFilters();
} 