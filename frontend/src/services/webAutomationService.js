// Web automation service - communicates with backend automation API
import config from '../config/environment.js';

const API_BASE_URL = config.api.automation;

const apiPost = async (endpoint, body) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
        throw new Error(errorData.message || 'API call failed');
    }
    
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const easyApply = async (job, profile) => {
    return apiPost('/easy-apply', { job, profile });
};

export const complexApply = async (job, profile) => {
    return apiPost('/complex-apply', { job, profile });
};

