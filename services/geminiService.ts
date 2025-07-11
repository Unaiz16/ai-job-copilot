import type { Job, UserProfile, Application, AgentInsight, CareerArtifact, Experiment, ExtractedProfile, ExperimentProposal, ChatMessage } from '../types';
import type { Part, Chat, GenerateContentResponse } from '@google/genai';

// All AI functionality is now proxied through our secure backend.
const API_BASE_URL = '/api/ai';

const apiPost = async <T>(endpoint: string, body: object): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
        throw new Error(errorData.message || 'API call failed');
    }
    return response.json();
};

export const generateJobs = async (profile: UserProfile): Promise<Job[]> => {
    const result = await apiPost<{ jobs: Job[] }>('/generate-jobs', { profile });
    return result.jobs.map(job => ({ ...job, id: crypto.randomUUID() }));
};

export const generateTailoredCV = async (profile: UserProfile, job: Job, activeExperiments: Experiment[] = []): Promise<string> => {
    const result = await apiPost<{ text: string }>('/generate-cv', { profile, job, activeExperiments });
    return result.text;
};

export const generateCoverLetter = async (profile: UserProfile, job: Job): Promise<string> => {
    const result = await apiPost<{ text: string }>('/generate-cover-letter', { profile, job });
    return result.text;
};

export const extractProfileFromCV = async (
    cvData: { text?: string; file?: { mimeType: string; data: string } },
    linkedinUrl?: string,
    artifacts?: CareerArtifact[]
): Promise<ExtractedProfile | null> => {
    return apiPost<ExtractedProfile>('/extract-profile', { cvData, linkedinUrl, artifacts });
};

export const generateClarifyingQuestions = async (extractedProfile: ExtractedProfile): Promise<string> => {
    const result = await apiPost<{ text: string }>('/clarifying-questions', { extractedProfile });
    return result.text;
};

export const generateSuggestedJobRoles = async (profile: UserProfile): Promise<string[] | null> => {
    const result = await apiPost<{ roles: string[] }>('/suggest-roles', { profile });
    return result.roles;
}

export const generateInterviewPrep = async (profile: UserProfile, application: Application): Promise<string> => {
    const result = await apiPost<{ text: string }>('/interview-prep', { profile, application });
    return result.text;
};

export const analyzeAnswerWithAudio = async (profile: UserProfile, application: Application, question: string, audioBase64: string, audioMimeType: string): Promise<string> => {
    const result = await apiPost<{ text: string }>('/analyze-audio', { profile, application, question, audioBase64, audioMimeType });
    return result.text;
}

export const generatePerformanceInsights = async (profile: UserProfile, applications: Application[]): Promise<AgentInsight | null> => {
    return apiPost<AgentInsight>('/performance-insights', { profile, applications });
};


// --- Chat functionality still uses the frontend SDK for streaming, but under a new setup ---
// This is a special case. To provide a good streaming UX, the chat will remain on the client-side for now.
// A more robust solution would involve websockets to a backend, but this is a good compromise.

import { GoogleGenAI, Type } from "@google/genai";

const getAIChatClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is not set. Chat functionality will be limited.");
        // Return a mock or disabled client if you want the app to run without a key
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

export const startAssistantChat = (profile: UserProfile, applications: Application[]): Chat | null => {
    const ai = getAIChatClient();
    if (!ai) return null;

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

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
    });
};

export const getInitialAssistantMessage = async (chat: Chat): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message: "Give me a friendly, one-sentence greeting to start our conversation, addressing the user by the name provided in my system instructions." });
        return response.text;
    } catch (error) {
        console.error("Error getting initial assistant message:", error);
        return `Hello! I'm ready to help you with your job search. What can I do for you today?`;
    }
};

export const parseChatCommand = async (userText: string): Promise<any | null> => {
    const ai = getAIChatClient();
    if (!ai) return null;
    
    const commandSchema = {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.STRING,
                enum: ['find_jobs', 'switch_tab', 'get_status', 'none']
            },
            params: {
                type: Type.OBJECT,
                properties: {
                    mode: { type: Type.STRING, enum: ['autonomous', 'review'] },
                    tab: { type: Type.STRING, enum: ['Dashboard', 'Find Jobs', 'My Applications', 'Reports', 'My Profile', 'Doc Generator'] },
                    companyName: { type: Type.STRING }
                },
                nullable: true,
            }
        },
        required: ['command']
    };

    const prompt = `
        Analyze the user's request: "${userText}"
        Your task is to determine if this is a command. If it is not a command, return "none".
        Available commands:
        1. 'find_jobs': Trigger a job search. Requires 'mode' parameter ('autonomous' or 'review').
        2. 'switch_tab': Navigate the app. Requires 'tab' parameter.
        3. 'get_status': Check application status. Requires 'companyName'.
        If the user's request matches a command, return a JSON object with the command and its parameters.
        If it's just a greeting or conversational question, return a JSON object with command "none".
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: commandSchema,
            }
        });
        const result = JSON.parse(response.text.trim());
        if (result && result.command && result.command !== 'none') return result;
    } catch (error) {
        console.error("Error parsing chat command:", error);
    }
    
    return null;
};
