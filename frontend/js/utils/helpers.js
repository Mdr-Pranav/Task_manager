import { updateDashboardTheme } from '../pages/dashboard.js';

const Helpers = {
    // Date formatting
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    },

    // Format relative time (e.g., "2 days ago")
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    },

    // Generate unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Local storage helpers
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
        },

        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return null;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Error removing from localStorage:', e);
            }
        }
    },

    // DOM helpers
    dom: {
        create(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'dataset') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => {
                        element.dataset[dataKey] = dataValue;
                    });
                } else {
                    element.setAttribute(key, value);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });

            return element;
        },

        empty(element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    },

    // Error handling
    handleError(error, fallbackMessage = 'An error occurred') {
        console.error(error);
        return {
            message: error.message || fallbackMessage,
            type: 'error'
        };
    },

    // Color helpers
    getStatusColor(status) {
        const colors = {
            'pending': 'yellow',
            'in-progress': 'blue',
            'completed': 'green'
        };
        return colors[status] || 'gray';
    },

    getPriorityColor(priority) {
        const colors = {
            'high': 'red',
            'medium': 'yellow',
            'low': 'green'
        };
        return colors[priority] || 'gray';
    }
};

// Toggle dark mode
export function initializeDarkMode() {
    const darkModeToggle = document.querySelector('#dark-mode-toggle');
    if (!darkModeToggle) return;

    // Set initial state
    if (localStorage.getItem('darkMode') === 'true' || 
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        enableDarkMode();
    }

    // Toggle on click
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
    updateDarkModeIcon();
    updateDashboardTheme();
}

function enableDarkMode() {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
}

function disableDarkMode() {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
}

// Update dark mode icon
function updateDarkModeIcon() {
    const darkModeToggle = document.querySelector('#dark-mode-toggle');
    if (!darkModeToggle) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    darkModeToggle.innerHTML = isDark ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    
    // Update button styling
    if (isDark) {
        darkModeToggle.classList.add('text-yellow-400', 'hover:text-yellow-300');
        darkModeToggle.classList.remove('text-gray-600', 'hover:text-gray-800');
    } else {
        darkModeToggle.classList.add('text-gray-600', 'hover:text-gray-800');
        darkModeToggle.classList.remove('text-yellow-400', 'hover:text-yellow-300');
    }
}

// Format time
export function formatTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString();
}

// Format datetime
export function formatDateTime(date) {
    if (!date) return '';
    return `${Helpers.formatDate(date)} ${Helpers.formatTime(date)}`;
}

// Truncate text
export function truncateText(text, length = 50) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// Generate random color
export function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Copy to clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy text:', error);
        return false;
    }
}

// Download file
export function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

// Parse query string
export function parseQueryString(queryString) {
    const params = {};
    const queries = queryString.substring(1).split('&');
    
    queries.forEach(query => {
        const [key, value] = query.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    
    return params;
}

// Build query string
export function buildQueryString(params) {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

// Validate email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file extension
export function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// Format currency
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format number
export function formatNumber(number, locale = 'en-US') {
    return new Intl.NumberFormat(locale).format(number);
}

// Format percentage
export function formatPercentage(number, decimals = 0) {
    return number.toFixed(decimals) + '%';
}

// Generate UUID
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Sleep function
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if element is in viewport
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Get random integer between min and max
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
} 