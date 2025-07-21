// Import modules
import { initializeSidebar } from './js/components/sidebar.js';
import { initializeDarkMode } from './js/utils/helpers.js';
import { initializeDashboard } from './js/pages/dashboard.js';
import { initializeTasks } from './js/pages/tasks.js';
import { initializeCategories } from './js/pages/categories.js';
import { initializeNotes, loadNotes, renderNotesPage } from './js/components/notes.js';

const App = {
    currentRoute: 'dashboard',
    isInitialized: false,

    init: async function() {
        try {
            // Initialize components
            initializeSidebar();
            initializeDarkMode();
            
            // Initialize tasks first since notes depend on them
            await initializeTasks();
            this.isInitialized = true;
            
            // Initialize other components
            initializeDashboard();
            initializeCategories();
            initializeNotes();
            
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
            await this.navigateToPage(currentPage);
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    },

    toggleDarkMode: function() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', isDark);
    },

    navigateToPage: async function(pageName) {
        try {
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
                    await initializeTasks();
                    break;
                case 'categories':
                    await initializeCategories();
                    break;
                case 'dashboard':
                    await initializeDashboard();
                    break;
                case 'notes':
                    // Make sure tasks are loaded before showing notes
                    await initializeTasks();
                    // Wait a bit to ensure tasks are processed
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await renderNotesPage();
                    break;
            }
        } catch (error) {
            console.error('Error navigating to page:', error);
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init()); 