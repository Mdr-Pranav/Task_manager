// State
let categories = [];
let retryTimeout = null;

// Initialize categories page
export function initializeCategories() {
    fetchCategories();
    setupEventListeners();
}

// Fetch categories
async function fetchCategories() {
    try {
        // Get categories from localStorage or initialize empty array
        const storedCategories = localStorage.getItem('categories');
        categories = storedCategories ? JSON.parse(storedCategories) : [];
        
        if (!Array.isArray(categories)) {
            categories = [];
        }
        
        // Clear any existing retry timeout
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
        
        renderCategories();
    } catch (error) {
        console.error('Error fetching categories:', error);
        categories = []; // Ensure categories is empty array on error
        showErrorMessage(error.message || 'Unable to load categories. Please try again later.');
    }
}

// Show retrying message
function showRetryingMessage() {
    const categoriesContainer = document.querySelector('#categories-container');
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = `
        <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Connecting to database...</strong>
            <span class="block sm:inline"> Please wait while we establish the connection.</span>
            <div class="mt-2">
                <div class="animate-pulse bg-yellow-200 h-1 rounded">
                    <div class="bg-yellow-400 h-1 rounded" style="width: 50%"></div>
                </div>
            </div>
        </div>
    `;
}

// Show error message
function showErrorMessage(message) {
    const categoriesContainer = document.querySelector('#categories-container');
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = `
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline"> ${message}</span>
        </div>
    `;
}

// Render categories
function renderCategories() {
    const categoriesContainer = document.querySelector('#categories-container');
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = '';
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 transform transition-all duration-200 hover:shadow-lg';
        categoryElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ${category.color}">
                        <i class="fas fa-${category.icon} text-white"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">${category.name}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-300">${category.description || 'No description'}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        ${category.tasks ? category.tasks.length : 0} tasks
                    </span>
                    <div class="flex space-x-2">
                        <button class="edit-category-btn text-blue-500 hover:text-blue-600 p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-full transition-colors duration-200" 
                                data-category-id="${category.id}"
                                title="Edit Category">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-category-btn text-red-500 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-gray-700 rounded-full transition-colors duration-200" 
                                data-category-id="${category.id}"
                                title="Delete Category">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        categoriesContainer.appendChild(categoryElement);
    });
}

// Setup event listeners
function setupEventListeners() {
    const addCategoryBtn = document.querySelector('#add-category-btn');
    const categoryForm = document.querySelector('#category-form');
    const categoryModal = document.querySelector('#category-modal');
    const cancelCategoryBtn = document.querySelector('#cancel-category-btn');

    if (addCategoryBtn) {
        addCategoryBtn.classList.remove('hidden');
        addCategoryBtn.addEventListener('click', () => showCategoryModal());
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }

    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            categoryModal.classList.add('hidden');
        });
    }

    if (categoryModal) {
        categoryModal.addEventListener('click', (e) => {
            if (e.target === categoryModal) {
                categoryModal.classList.add('hidden');
            }
        });
    }

    // Event delegation for edit and delete buttons
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-category-btn');
        const deleteBtn = e.target.closest('.delete-category-btn');

        if (editBtn) {
            const categoryId = parseInt(editBtn.dataset.categoryId);
            showCategoryModal(categoryId);
        }

        if (deleteBtn) {
            const categoryId = parseInt(deleteBtn.dataset.categoryId);
            deleteCategory(categoryId);
        }
    });
}

// Show category modal
function showCategoryModal(categoryId = null) {
    const category = categoryId ? categories.find(c => c.id === categoryId) : null;
    const modalTitle = document.querySelector('#category-modal-title');
    const form = document.querySelector('#category-form');
    
    modalTitle.textContent = category ? 'Edit Category' : 'Add New Category';
    form.dataset.categoryId = categoryId || '';
    
    // Reset and populate form
    form.reset();
    if (category) {
        form.name.value = category.name;
        form.description.value = category.description || '';
        form.color.value = category.color;
        form.icon.value = category.icon;
    }
    
    document.querySelector('#category-modal').classList.remove('hidden');
}

// Handle category form submission
async function handleCategorySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const categoryId = form.dataset.categoryId;
    
    const categoryData = {
        id: categoryId ? parseInt(categoryId) : Date.now(), // Use timestamp as ID for new categories
        name: form.name.value,
        description: form.description.value,
        color: form.color.value,
        icon: form.icon.value
    };

    try {
        if (categoryId) {
            // Update existing category
            const index = categories.findIndex(c => c.id === parseInt(categoryId));
            if (index !== -1) {
                categories[index] = { ...categories[index], ...categoryData };
            }
        } else {
            // Add new category
            categories.push(categoryData);
        }

        // Save to localStorage
        localStorage.setItem('categories', JSON.stringify(categories));

        document.querySelector('#category-modal').classList.add('hidden');
        await fetchCategories();
    } catch (error) {
        alert(error.message);
        console.error('Error saving category:', error);
    }
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? All associated tasks will be updated to have no category.')) return;

    try {
        // Remove category from array
        categories = categories.filter(c => c.id !== categoryId);
        
        // Save to localStorage
        localStorage.setItem('categories', JSON.stringify(categories));

        // Update tasks to remove the deleted category
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.map(task => {
            if (task.categoryId === categoryId) {
                return { ...task, categoryId: null };
            }
            return task;
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));

        await fetchCategories();
    } catch (error) {
        alert(error.message);
        console.error('Error deleting category:', error);
    }
} 