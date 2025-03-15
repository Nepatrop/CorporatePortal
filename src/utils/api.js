const API_URL = 'http://localhost:8081';
const API_KEY = 'cp_e29b7d8f4a6c2135d9f0';

const defaultHeaders = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
};

export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'X-API-Key': API_KEY
            }
        });
        return response.json();
    },

    post: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(data)
        });
        return response;
    },

    postFormData: async (endpoint, formData) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                // Не добавляем Content-Type, он будет установлен автоматически для FormData
            },
            body: formData
        });
        return response;
    },

    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'X-API-Key': API_KEY
            }
        });
        return response.json();
    }
};
