// Google Sheets service - communicates with backend Google Sheets API
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

export const createApplicationSheet = async (profile) => {
    return apiPost('/create-sheet', { profile });
};

export const syncApplicationsToSheet = async (sheetId, applications) => {
    return apiPost('/sync-to-sheet', { sheetId, applications });
};

export const importApplicationsFromSheet = async (sheetId) => {
    const result = await apiPost('/sync-from-sheet', { sheetId });
    return result?.applications || [];
};

