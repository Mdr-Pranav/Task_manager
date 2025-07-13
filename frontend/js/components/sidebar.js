// Initialize sidebar
export function initializeSidebar() {
    setupSidebar();
    setupEventListeners();
}

// Setup sidebar
function setupSidebar() {
    const sidebar = document.querySelector('#sidebar');
    const mainContent = document.querySelector('#main-content');
    
    if (!sidebar || !mainContent) {
        console.error('Required sidebar elements not found');
        return;
    }
    
    // Show dashboard by default
    showPage('dashboard');
    
    // Show appropriate action button
    updateActionButton('dashboard');
}

// Setup event listeners
function setupEventListeners() {
    const sidebarToggle = document.querySelector('#sidebar-toggle');
    const sidebar = document.querySelector('#sidebar');
    const mainContent = document.querySelector('#main-content');
    const navLinks = document.querySelectorAll('[data-page]');

    if (!sidebarToggle || !sidebar || !mainContent) {
        console.error('Required sidebar elements not found');
        return;
    }

    // Toggle sidebar
    sidebarToggle.addEventListener('click', () => {
        const isOpen = !sidebar.classList.contains('-translate-x-full');
        
        if (isOpen) {
            sidebar.classList.add('-translate-x-full');
            mainContent.classList.remove('ml-64');
            mainContent.classList.add('ml-0');
        } else {
            sidebar.classList.remove('-translate-x-full');
            mainContent.classList.remove('ml-0');
            mainContent.classList.add('ml-64');
        }
    });

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            // Update active link
            navLinks.forEach(l => {
                l.classList.remove('bg-gray-100', 'dark:bg-gray-700');
                l.classList.add('hover:bg-gray-100', 'dark:hover:bg-gray-700');
            });
            link.classList.add('bg-gray-100', 'dark:bg-gray-700');
            link.classList.remove('hover:bg-gray-100', 'dark:hover:bg-gray-700');

            // Show page
            showPage(page);
            
            // Update action button
            updateActionButton(page);

            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                sidebar.classList.add('-translate-x-full');
                mainContent.classList.remove('ml-64');
                mainContent.classList.add('ml-0');
            }
        });
    });
}

// Show page
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    if (!pages.length) {
        console.error('No pages found');
        return;
    }

    pages.forEach(page => {
        if (page.id === `${pageName}-page`) {
            page.classList.remove('hidden');
        } else {
            page.classList.add('hidden');
        }
    });
}

// Update action button
function updateActionButton(pageName) {
    const addTaskBtn = document.querySelector('#add-task-btn');
    const addCategoryBtn = document.querySelector('#add-category-btn');

    // If buttons don't exist, don't try to update them
    if (!addTaskBtn || !addCategoryBtn) {
        console.warn('Action buttons not found');
        return;
    }

    // Hide both buttons first
    addTaskBtn.classList.add('hidden');
    addCategoryBtn.classList.add('hidden');

    // Show appropriate button based on page
    switch (pageName) {
        case 'tasks':
            addTaskBtn.classList.remove('hidden');
            break;
        case 'categories':
            addCategoryBtn.classList.remove('hidden');
            break;
        case 'notes':
            // When showing notes page, update the notes list
            if (typeof window.updateNotesList === 'function') {
                window.updateNotesList(window.currentTasks || []);
            }
            break;
        default:
            // No button shown for other pages (like dashboard)
            break;
    }
} 