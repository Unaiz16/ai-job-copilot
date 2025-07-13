// AI functionality proxied through the secure backend
import config from '../config/environment.js';

const API_BASE_URL = config.api.ai;

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
    // Handle cases where the response body might be empty
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const generateJobs = async (profile) => {
    const result = await apiPost('/generate-jobs', { profile });
    return result?.jobs?.map(job => ({ ...job, id: crypto.randomUUID() })) || [];
};

export const generateTailoredCV = async (profile, job, activeExperiments = []) => {
    const result = await apiPost('/generate-cv', { profile, job, activeExperiments });
    return result?.text || '';
};

export const generateCoverLetter = async (profile, job) => {
    const result = await apiPost('/generate-cover-letter', { profile, job });
    return result?.text || '';
};

export const extractProfileFromCV = async (cvData, linkedinUrl, artifacts) => {
    return apiPost('/extract-profile', { cvData, linkedinUrl, artifacts });
};

export const generateClarifyingQuestions = async (extractedProfile) => {
    const result = await apiPost('/clarifying-questions', { extractedProfile });
    return result?.text || '';
};

export const generateSuggestedJobRoles = async (profile) => {
    const result = await apiPost('/suggest-roles', { profile });
    return result?.roles || null;
};

export const generateInterviewPrep = async (profile, application) => {
    const result = await apiPost('/interview-prep', { profile, application });
    return result?.text || '';
};

export const analyzeAnswerWithAudio = async (profile, application, question, audioBase64, audioMimeType) => {
    const result = await apiPost('/analyze-audio', { profile, application, question, audioBase64, audioMimeType });
    return result?.text || '';
};

export const generatePerformanceInsights = async (profile, applications) => {
    return apiPost('/performance-insights', { profile, applications });
};

// Chat functionality
export const createChatContext = (profile, applications) => {
    const applicationSummary = applications.slice(0, 5).map(app => `- ${app.title} at ${app.company} (Status: ${app.status})`).join('\n');

    const systemInstruction = `
You are an expert AI Job Copilot assistant. Your name is Copi. You are friendly, proactive, and encouraging.
Your primary goal is to help the user manage their job search and provide strategic advice.

You have access to the user's profile and recent application data.
- User's Name: ${profile.name}
- Target Roles: ${profile.jobRoles}
- Recent Applications:
${applicationSummary || "No applications yet."}

You can also execute commands. If the user's request seems like a command, you MUST respond ONLY with a JSON object like {"command": "...", "params": {...}}. Do not add any other text.
Available commands:
1.  \`find_jobs\`: Find new jobs.
    - params: \`mode\` ('autonomous' or 'review').
    - Example prompt: "find me some new jobs in review mode" -> {"command": "find_jobs", "params": {"mode": "review"}}
2.  \`switch_tab\`: Navigate to a different tab in the application.
    - params: \`tab\` ('Dashboard', 'Find Jobs', 'My Applications', 'Reports', 'My Profile', 'Doc Generator').
    - Example prompt: "show me my applications" -> {"command": "switch_tab", "params": {"tab": "My Applications"}}
3.  \`get_status\`: Get the status of a specific application.
    - params: \`companyName\` (string).
    - Example prompt: "what's the status with my application to Google?" -> {"command": "get_status", "params": {"companyName": "Google"}}

For all other conversational queries, provide helpful, concise answers based on the user's data. Be a true copilot!
`;

    return { systemInstruction };
};

export const sendChatMessage = async (chatContext, message) => {
    try {
        const result = await apiPost('/chat/send-message', {
            systemInstruction: chatContext.systemInstruction,
            message: message,
        });
        if (result && result.text) {
            return result.text;
        }
        return "Sorry, I couldn't get a response from the assistant.";
    } catch (error) {
        console.error("Error sending chat message:", error);
        return "Sorry, I couldn't connect to the chat service right now.";
    }
};

export const parseChatCommand = async (userText) => {
    try {
        const result = await apiPost('/chat/parse-command', { userText });
        if (result && result.command && result.command !== 'none') {
            return result;
        }
    } catch (error) {
        console.error("Error parsing chat command:", error);
    }
    return null;
};

