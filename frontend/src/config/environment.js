// Environment configuration for API endpoints
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API Base URLs
const API_ENDPOINTS = {
    development: {
        ai: 'http://localhost:3000/api/ai',
        data: 'http://localhost:3000/api/data',
        automation: 'http://localhost:3000/api/automation',
        gdrive: 'http://localhost:3000/api/gdrive'
    },
    production: {
        ai: 'https://ai-job-copilot.onrender.com/api/ai',
        data: 'https://ai-job-copilot.onrender.com/api/data',
        automation: 'https://ai-job-copilot.onrender.com/api/automation',
        gdrive: 'https://ai-job-copilot.onrender.com/api/gdrive'
    }
};

// Get current environment endpoints
const currentEndpoints = isDevelopment ? API_ENDPOINTS.development : API_ENDPOINTS.production;

export const config = {
    isDevelopment,
    isProduction,
    api: {
        ai: currentEndpoints.ai,
        data: currentEndpoints.data,
        automation: currentEndpoints.automation,
        gdrive: currentEndpoints.gdrive
    }
};

export default config;

