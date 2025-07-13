// Google Drive service - communicates with backend Google Drive API
import config from '../config/environment.js';

const API_BASE_URL = config.api.gdrive;

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

export const saveFile = async (fileName, content) => {
    const result = await apiPost('/save-file', { fileName, content });
    return result?.url;
};

