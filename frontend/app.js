// Import modules
import { initializeSidebar } from './js/components/sidebar.js';
import { initializeDarkMode } from './js/utils/helpers.js';
import { initializeDashboard } from './js/pages/dashboard.js';
import { initializeTasks } from './js/pages/tasks.js';
import { initializeCategories } from './js/pages/categories.js';
import { initializeNotes, loadNotes } from './js/components/notes.js';

const App = {
    currentRoute: 'dashboard',

    init: async function() {
        // Initialize components
        initializeSidebar();
        initializeDarkMode();
        initializeDashboard();
        initializeTasks();
        initializeCategories();
        
        // Initialize notes
        initializeNotes();
        loadNotes();
        
        // Set up dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', this.toggleDarkMode);
            
            // Set initial dark mode state
            if (localStorage.getItem('darkMode') === 'true' || 
                (!localStorage.getItem('darkMode') && 
                 window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                darkModeToggle.checked = true;
            }
        }

        // Set up navigation
        const navLinks = document.querySelectorAll('[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPage(link.dataset.page);
            });
        });

        // Show initial page
        const currentPage = window.location.hash.slice(1) || 'dashboard';
        this.navigateToPage(currentPage);
    },

    toggleDarkMode: function() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
    },

    navigateToPage: function(pageName) {
        // Update URL hash
        window.location.hash = pageName;

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Show selected page
        const selectedPage = document.getElementById(`${pageName}-page`);
        if (selectedPage) {
            selectedPage.classList.remove('hidden');
        }

        // Update active navigation link
        document.querySelectorAll('[data-page]').forEach(link => {
            if (link.dataset.page === pageName) {
                link.classList.add('bg-gray-100', 'dark:bg-gray-700');
                link.classList.remove('hover:bg-gray-100', 'dark:hover:bg-gray-700');
            } else {
                link.classList.remove('bg-gray-100', 'dark:bg-gray-700');
                link.classList.add('hover:bg-gray-100', 'dark:hover:bg-gray-700');
            }
        });

        // Update action buttons
        const addTaskBtn = document.querySelector('#add-task-btn');
        const addCategoryBtn = document.querySelector('#add-category-btn');

        if (addTaskBtn && addCategoryBtn) {
            addTaskBtn.classList.add('hidden');
            addCategoryBtn.classList.add('hidden');

            switch (pageName) {
                case 'tasks':
                    addTaskBtn.classList.remove('hidden');
                    break;
                case 'categories':
                    addCategoryBtn.classList.remove('hidden');
                    break;
            }
        }

        // Refresh content based on page
        switch (pageName) {
            case 'tasks':
                initializeTasks();
                break;
            case 'categories':
                initializeCategories();
                break;
            case 'dashboard':
                initializeDashboard();
                break;
            case 'notes':
                // Update notes list when navigating to notes page
                if (typeof window.updateNotesList === 'function') {
                    window.updateNotesList(window.currentTasks || []);
                }
                break;
        }
    },

    async navigate(route) {
        this.currentRoute = route;
        initializeSidebar.setActiveRoute(route);

        // Clear any existing error messages
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="spinner"></div>
            </div>
        `;

        try {
            switch (route) {
                case 'dashboard':
                    await initializeDashboard.init();
                    break;
                case 'tasks':
                    await initializeTasks.init();
                    break;
                case 'categories':
                    await initializeCategories.init();
                    break;
                default:
                    content.innerHTML = `
                        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                            <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                            <p>Page not found</p>
                        </div>
                    `;
            }
        } catch (error) {
            content.innerHTML = `
                <div class="text-center text-red-500 py-8">
                    <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init()); 