// Data persistence service - communicates with backend API
import config from '../config/environment.js';

const API_BASE_URL = config.api.data;

const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
        const configObj = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        
        if (body) {
            configObj.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, configObj);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
            throw new Error(errorData.message || 'API call failed');
        }
        
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    } catch (error) {
        console.warn(`API call failed for ${endpoint}:`, error.message);
        // Return null for failed calls to allow graceful degradation
        return null;
    }
};

export const getProfile = async () => {
    return apiCall('/profile');
};

export const saveProfile = async (profile) => {
    return apiCall('/profile', 'POST', profile);
};

export const getApplications = async () => {
    return apiCall('/applications');
};

export const saveApplications = async (applications) => {
    return apiCall('/applications', 'POST', applications);
};

export const getExperiments = async () => {
    return apiCall('/experiments');
};

export const saveExperiments = async (experiments) => {
    return apiCall('/experiments', 'POST', experiments);
};

