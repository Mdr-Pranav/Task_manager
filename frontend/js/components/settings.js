// Settings component for managing application data
export class Settings {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'settings-container p-4';
        this.render();
    }

    async clearAllData() {
        if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/settings/clear-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('All data has been cleared successfully.');
                // Reload the page to reflect the changes
                window.location.reload();
            } else {
                throw new Error('Failed to clear data');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Failed to clear data. Please try again.');
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Settings</h2>
                
                <div class="space-y-6">
                    <div class="border-b pb-6">
                        <h3 class="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Data Management</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">Clear all data including tasks, subtasks, and notes.</p>
                        <button id="clearAllData" 
                                class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Clear All Data
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.container.querySelector('#clearAllData').addEventListener('click', () => this.clearAllData());
    }

    getContainer() {
        return this.container;
    }
} 