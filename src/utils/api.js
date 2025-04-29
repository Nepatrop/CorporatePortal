// Функция для получения IP адреса сервера
const getServerIP = () => {
    // Если мы на localhost, используем его
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'localhost';
    }
    // Иначе используем текущий IP адрес
    return window.location.hostname;
};

export const API_URL = `http://${getServerIP()}:8081`;
const API_KEY = 'cp_e29b7d8f4a6c2135d9f0';

const defaultHeaders = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
};

export const api = {
    get: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: defaultHeaders
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

    put: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: defaultHeaders,
            body: JSON.stringify(data)
        });
        return response;
    },

    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: defaultHeaders
        });
        return response;
    },

    // Специальные методы для работы с формами и файлами где не нужен Content-Type: application/json
    postFormData: async (endpoint, formData) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'X-API-Key': API_KEY
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || 'Server error');
                } catch {
                    throw new Error(errorText || 'Server error');
                }
            }

            return response.json();
        } catch (error) {
            console.error('Error in postFormData:', error);
            throw error;
        }
    },

    putFormData: async (endpoint, formData) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'X-API-Key': API_KEY
            },
            body: formData
        });
        return response;
    }
};


