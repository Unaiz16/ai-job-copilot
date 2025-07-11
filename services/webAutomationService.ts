import type { UserProfile, Job } from '../types';

interface AutomationResult {
    success: boolean;
    log: string[];
}

const API_BASE_URL = '/api';

const apiPost = async <T>(endpoint: string, body: object): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `API call failed with status ${response.status}` }));
            throw new Error(errorData.message);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error calling endpoint ${endpoint}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, log: [`[FATAL] Could not connect to the backend automation service: ${errorMessage}`] } as unknown as T;
    }
};

export const easyApply = async (
    job: Job,
    profile: UserProfile
): Promise<AutomationResult> => {
    return apiPost<AutomationResult>('/automation/easy-apply', { job, profile });
};

export const complexApply = async (
    job: Job,
    profile: UserProfile
): Promise<AutomationResult> => {
    return apiPost<AutomationResult>('/automation/complex-apply', { job, profile });
};
