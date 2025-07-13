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