import type { UserProfile, Application, Experiment } from '../types';

const API_BASE_URL = '/api/data';

const apiGet = async <T>(endpoint: string): Promise<T | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            console.error(`API GET ${endpoint} failed with status ${response.status}:`, await response.text());
            return null;
        }
        if (response.status === 204) { // No content
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`Error in apiGet for ${endpoint}:`, error);
        return null;
    }
};

const apiPost = async <T>(endpoint: string, body: any): Promise<T | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            console.error(`API POST ${endpoint} failed with status ${response.status}:`, await response.text());
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`Error in apiPost for ${endpoint}:`, error);
        return null;
    }
};

// Profile
export const getProfile = () => apiGet<UserProfile>('/profile');
export const saveProfile = (profile: UserProfile) => apiPost<UserProfile>('/profile', profile);

// Applications
export const getApplications = () => apiGet<Application[]>('/applications');
export const saveApplications = (applications: Application[]) => apiPost<Application[]>('/applications', applications);

// Experiments
export const getExperiments = () => apiGet<Experiment[]>('/experiments');
export const saveExperiments = (experiments: Experiment[]) => apiPost<Experiment[]>('/experiments', experiments);
