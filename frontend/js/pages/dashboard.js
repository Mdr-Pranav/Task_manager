import { createTaskStatusChart, createTaskPriorityChart, updateChartTheme } from '../components/charts.js';
import { Settings } from '../components/settings.js';

let tasks = [];
let statusChart = null;
let priorityChart = null;

// Initialize dashboard
export function initializeDashboard() {
    fetchTasks();
}

// Fetch tasks
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        renderDashboard();
        updateCharts();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

// Update charts
function updateCharts() {
    if (statusChart) {
        statusChart.destroy();
    }
    if (priorityChart) {
        priorityChart.destroy();
    }

    statusChart = createTaskStatusChart(tasks);
    priorityChart = createTaskPriorityChart(tasks);
}

// Render dashboard
function renderDashboard() {
    const dashboardPage = document.getElementById('dashboard-page');
    if (!dashboardPage) return;

    dashboardPage.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Task Statistics -->
            <div class="stats-card">
                <h2 class="text-xl font-semibold mb-4 dark:text-white">Task Statistics</h2>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 dark:text-gray-300">Total Tasks</span>
                        <span class="text-2xl font-bold text-gray-800 dark:text-white">${tasks.length}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 dark:text-gray-300">Completed</span>
                        <span class="text-2xl font-bold text-green-600 dark:text-green-400">
                            ${tasks.filter(t => t.status === 'completed').length}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 dark:text-gray-300">In Progress</span>
                        <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${tasks.filter(t => t.status === 'in-progress').length}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600 dark:text-gray-300">Pending</span>
                        <span class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            ${tasks.filter(t => t.status === 'pending').length}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Task Status Chart -->
            <div class="stats-card">
                <h2 class="text-xl font-semibold mb-4 dark:text-white">Status Distribution</h2>
                <div class="h-64">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>

            <!-- Task Priority Chart -->
            <div class="stats-card">
                <h2 class="text-xl font-semibold mb-4 dark:text-white">Priority Distribution</h2>
                <div class="h-64">
                    <canvas id="priorityChart"></canvas>
                </div>
            </div>

            <!-- Recent Tasks -->
            <div class="lg:col-span-2 stats-card">
                <h2 class="text-xl font-semibold mb-4 dark:text-white">Recent Tasks</h2>
                <div class="space-y-3">
                    ${renderRecentTasks()}
                </div>
            </div>

            <!-- Due Tasks -->
            <div class="stats-card">
                <h2 class="text-xl font-semibold mb-4 dark:text-white">Due Soon</h2>
                <div class="space-y-3">
                    ${renderDueTasks()}
                </div>
            </div>
        </div>
    `;

    // Initialize charts after the elements are in the DOM
    updateCharts();
}

// Render recent tasks
function renderRecentTasks() {
    const recentTasks = tasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentTasks.length === 0) {
        return '<p class="text-gray-500 dark:text-gray-400">No tasks yet</p>';
    }

    return recentTasks.map(task => `
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
            <div class="flex-1">
                <h3 class="font-medium dark:text-white">${task.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">${task.description || 'No description'}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="status-badge ${task.status}">${task.status}</span>
                <span class="priority-badge ${task.priority}">${task.priority}</span>
            </div>
        </div>
    `).join('');
}

// Render due tasks
function renderDueTasks() {
    const now = new Date();
    const dueTasks = tasks
        .filter(task => task.dueDate && new Date(task.dueDate) > now && task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

    if (dueTasks.length === 0) {
        return '<p class="text-gray-500 dark:text-gray-400">No tasks due soon</p>';
    }

    return dueTasks.map(task => `
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
            <div class="flex-1">
                <h3 class="font-medium dark:text-white">${task.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Due: ${new Date(task.dueDate).toLocaleDateString()}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <span class="status-badge ${task.status}">${task.status}</span>
                <span class="priority-badge ${task.priority}">${task.priority}</span>
            </div>
        </div>
    `).join('');
}

// Update dashboard theme
export function updateDashboardTheme() {
    if (statusChart) {
        updateChartTheme(statusChart);
    }
    if (priorityChart) {
        updateChartTheme(priorityChart);
    }
}

class Dashboard {
    constructor() {
        this.settings = new Settings();
        this.initializeTabs();
    }

    initializeTabs() {
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'flex border-b border-gray-200 mb-4';
        tabsContainer.innerHTML = `
            <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-b-2 border-blue-500" data-tab="tasks">Tasks</button>
            <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700" data-tab="categories">Categories</button>
            <button class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700" data-tab="settings">Settings</button>
        `;

        tabsContainer.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]')) {
                const selectedTab = e.target.getAttribute('data-tab');
                this.switchTab(selectedTab);
                
                tabsContainer.querySelectorAll('[data-tab]').forEach(tab => {
                    tab.className = 'px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700';
                });
                e.target.className = 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border-b-2 border-blue-500';
            }
        });

        this.container.prepend(tabsContainer);
    }

    switchTab(tab) {
        this.tasksContainer.style.display = 'none';
        this.categoriesContainer.style.display = 'none';
        this.settings.getContainer().style.display = 'none';

        switch (tab) {
            case 'tasks':
                this.tasksContainer.style.display = 'block';
                break;
            case 'categories':
                this.categoriesContainer.style.display = 'block';
                break;
            case 'settings':
                this.settings.getContainer().style.display = 'block';
                break;
        }
    }

    render() {
        this.container.appendChild(this.settings.getContainer());
        this.settings.getContainer().style.display = 'none';
    }
} 