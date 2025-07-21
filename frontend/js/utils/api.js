const API = {
    baseURL: 'http://localhost:3000/api',

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API request failed');
            }

            // For DELETE operations that return 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Tasks API
    tasks: {
        async getAll() {
            return API.request('/tasks');
        },

        async getById(id) {
            return API.request(`/tasks/${id}`);
        },

        async create(data) {
            return API.request('/tasks', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return API.request(`/tasks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return API.request(`/tasks/${id}`, {
                method: 'DELETE'
            });
        },

        async updatePosition(id, position) {
            return API.request(`/tasks/${id}/position`, {
                method: 'PATCH',
                body: JSON.stringify({ position })
            });
        }
    },

    // Subtasks API
    subtasks: {
        async getAll(taskId) {
            return API.request(`/tasks/${taskId}/subtasks`);
        },

        async create(taskId, data) {
            return API.request(`/tasks/${taskId}/subtasks`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(taskId, subtaskId, data) {
            return API.request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        async delete(taskId, subtaskId) {
            return API.request(`/tasks/${taskId}/subtasks/${subtaskId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },

        async toggleComplete(taskId, subtaskId) {
            return API.request(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
                method: 'PATCH'
            });
        }
    },

    // Categories API
    categories: {
        async getAll() {
            return API.request('/categories');
        },

        async getById(id) {
            return API.request(`/categories/${id}`);
        },

        async create(data) {
            return API.request('/categories', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return API.request(`/categories/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return API.request(`/categories/${id}`, {
                method: 'DELETE'
            });
        }
    }
};

export default API; 