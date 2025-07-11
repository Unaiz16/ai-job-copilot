import type { UserProfile, Application } from '../types';

const API_BASE_URL = '/api';

interface Sheet {
    id: string;
    url: string;
}

const apiPost = async <T>(endpoint: string, body: object): Promise<T | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            console.error(`API call to ${endpoint} failed with status ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error calling endpoint ${endpoint}:`, error);
        return null;
    }
};


export const createApplicationSheet = async (profile: UserProfile): Promise<Sheet | null> => {
    return apiPost<Sheet>('/gdrive/create-sheet', { profile });
};

export const syncApplicationsToSheet = async (sheetId: string, applications: Application[]): Promise<boolean> => {
    const result = await apiPost<{ success: boolean }>('/gdrive/sync-to-sheet', { sheetId, applications });
    return result?.success || false;
};

export const importApplicationsFromSheet = async (sheetId: string): Promise<Application[]> => {
    const result = await apiPost<{ applications: Application[] }>('/gdrive/sync-from-sheet', { sheetId });
    return result?.applications || [];
};
