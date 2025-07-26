
import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import { supabase } from './supabaseClient';
import { GoogleGenAI, Type } from '@google/genai';


const app: express.Express = express();
const port = process.env.PORT || 3001;

// --- Initialize Gemini ---
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  console.log('[server]: GoogleGenAI client initialized successfully.');
} else {
  console.warn('[server]: IMPORTANT - API_KEY (for Gemini) is not set. AI functionality will be disabled.');
}


// Middlewares
// CORS configuration to allow requests from Google's dynamic frontend environments
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Whitelist of allowed domain suffixes
    const allowedDomainSuffixes = [
        '.google-labs-studio.web.app',
        '.scf.usercontent.goog', // From user logs
        '.render.com', // Allow backend to be called from other render services
        '.netlify.app', // Allow Netlify deployments
        'localhost' // Allow local development
    ];

    try {
        const originHostname = new URL(origin).hostname;
        if (allowedDomainSuffixes.some(suffix => 
            originHostname.endsWith(suffix) || originHostname === suffix || originHostname.includes('localhost')
        )) {
            return callback(null, true); // Allow if origin ends with a whitelisted suffix
        }
    } catch (e: any) {
        // The origin is not a valid URL, reject it
        console.error(`Invalid CORS origin received: ${origin}`, e);
        return callback(new Error('Invalid Origin'));
    }
    
    // If not in whitelist, reject the request
    console.error(`CORS policy rejection for origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));



// --- API ROUTES ---

// Health Check
app.get("/api/health", (req: ExpressRequest, res: ExpressResponse) => {
  res.status(200).json({ 
      message: 'AI Job Copilot Backend is running!', 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
  });
});

// Middleware to check for DB and AI connections
const checkDbConnection = (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Database service is not configured on the server.' });
  }
  next();
};

const checkAiConnection = (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    if(!ai) {
        return res.status(503).json({ message: 'AI service is not configured on the server.' });
    }
    next();
}

const handleApiError = (error: any, res: ExpressResponse, endpoint: string) => {
    console.error(`Error in ${endpoint}:`, error);
    res.status(500).json({ message: `Failed in ${endpoint}: ${error.message}`});
}

const safeJsonParse = (jsonString: string) => {
    try {
        // Attempt to remove common markdown code fences
        const cleanedString = jsonString.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(cleanedString);
    } catch {
        console.error("Failed to parse JSON string:", jsonString);
        throw new Error("Received malformed JSON from AI model.");
    }
}


// --- Data Persistence Routes ---
const dataRouter = express.Router();

const DUMMY_USER_ID = 1; 
const DUMMY_USER_UUID = '00000000-0000-0000-0000-000000000000';

// Profile
dataRouter.get('/profile', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from('profiles').select('*').eq('id', DUMMY_USER_ID).single();
        if (error && error.code !== 'PGRST116') { // Ignore 'single row not found' error
            return handleApiError(error, res, 'getProfile');
        }
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, 'getProfile');
    }
});

dataRouter.post('/profile', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const fullProfile: { [key: string]: any } = req.body;
        
        // **CRITICAL FIX**: This is a "whitelist" of columns that are known to exist in the user's database.
        // The backend will ONLY try to save columns from this list.
        // This prevents crashes if the frontend sends data for a column that doesn't exist in the database schema.
        const KNOWN_SAFE_COLUMNS = [
            'name', 'summary', 'linkedinUrl', 'email', 'agentEmail', 'agentPassword',
            'gdriveLinked', 'gSheetId', 'gSheetUrl', 'artifacts', 'minimumFitScore',
            'jobRoles', 'locations', 'keySkills', 'yearsOfExperience', 'education', 
            'languages', 'certifications', 'baseCV', 'baseCVfilename', 'autonomousMode'
        ];

        const profileToSave: { [key:string]: any } = {};
        
        KNOWN_SAFE_COLUMNS.forEach(key => {
            // Check if the incoming profile from the frontend *actually has* this key before adding it.
            if (Object.prototype.hasOwnProperty.call(fullProfile, key)) {
                profileToSave[key] = fullProfile[key];
            }
        });

        // The user ID is always required for the upsert operation to identify the correct row.
        profileToSave.id = DUMMY_USER_ID;

        const { data, error } = await supabase!.from('profiles').upsert(profileToSave).select().single();
        
        if (error) {
            console.error("Error during 'upsert' in saveProfile. This is likely due to a schema mismatch even with filtering. Error details:", error);
            return handleApiError(error, res, 'saveProfile');
        }
        
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, 'saveProfile');
    }
});


// Generic function for handling data sync with "Smart Save" filtering
const syncTable = async (req: ExpressRequest, res: ExpressResponse, tableName: string, coreColumns: string[]) => {
    try {
        const items = req.body;
        
        const { error: deleteError } = await supabase!.from(tableName).delete().eq('user_id', DUMMY_USER_UUID);
        if (deleteError) return handleApiError(deleteError, res, `delete from ${tableName}`);

        if (items && Array.isArray(items) && items.length > 0) {
            
            const itemsToInsert = items.map((item: any) => {
                const filteredItem: { [key: string]: any } = {};
                coreColumns.forEach(key => {
                    if (Object.prototype.hasOwnProperty.call(item, key)) {
                        filteredItem[key] = item[key];
                    }
                });
                filteredItem.user_id = DUMMY_USER_UUID;
                return filteredItem;
            });
            
            const { data, error: insertError } = await supabase!.from(tableName).insert(itemsToInsert).select();
            if (insertError) {
                console.error(`Error in insert into ${tableName}:`, insertError);
                return handleApiError(insertError, res, `insert into ${tableName}`);
            }
            return res.status(200).json(data);
        }

        return res.status(200).json([]);
    } catch (e: any) {
        handleApiError(e, res, `syncTable for ${tableName}`);
    }
};

// This list specifically EXCLUDES 'agentLog' which was reported missing in logs.
const coreApplicationColumns = [
    'id', 'company', 'title', 'location', 'description', 'salary', 
    'sourceUrl', 'fitScore', 'reasoning', 'status', 'tailoredCV', 
    'coverLetter', 'appliedDate', 'interviewPrepKit', 
    'cvGdriveUrl', 'coverLetterGdriveUrl', 'rejectionReason'
];

const coreExperimentColumns = [
    'id', 'hypothesis', 'method', 'status', 'results'
];

// Applications
dataRouter.get('/applications', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from('applications').select('*').eq('user_id', DUMMY_USER_UUID);
        if (error) return handleApiError(error, res, 'getApplications');
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, 'getApplications');
    }
});
dataRouter.post('/applications', (req: ExpressRequest, res: ExpressResponse) => syncTable(req, res, 'applications', coreApplicationColumns));

// Experiments
dataRouter.get('/experiments', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from('experiments').select('*').eq('user_id', DUMMY_USER_UUID);
        if (error) return handleApiError(error, res, 'getExperiments');
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, 'getExperiments');
    }
});
dataRouter.post('/experiments', (req: ExpressRequest, res: ExpressResponse) => syncTable(req, res, 'experiments', coreExperimentColumns));

// Analytics
dataRouter.get('/analytics', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        // Mock analytics data for now
        const mockAnalytics = {
            totalApplications: 0,
            responseRate: 0,
            interviewRate: 0,
            averageResponseTime: 0,
            platforms: [],
            recentActivity: []
        };
        res.status(200).json(mockAnalytics);
    } catch (e: any) {
        handleApiError(e, res, 'getAnalytics');
    }
});

app.use('/api/data', checkDbConnection, dataRouter);


// --- Live AI and Automation Routes ---

const aiRouter = express.Router();

aiRouter.post('/generate-jobs', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile } = req.body;
    const prompt = `Act as an expert headhunter. Use your search tool to find 5 real, currently active job postings in Germany that are a strong match for the following candidate profile. For each job, provide a direct URL to the application page in the 'sourceUrl' field.

    Candidate Profile:
    - Target Roles: ${profile.jobRoles ?? ''}
    - Target Locations: ${profile.locations ?? ''}
    - Key Skills: ${profile.keySkills ?? ''}
    - Experience: ${profile.yearsOfExperience ?? ''}
    - Summary: ${profile.summary ?? ''}

    Return your findings as a single JSON object with a key "jobs" which contains an array of job objects. Each job object must have these keys: "company", "title", "location", "description", "salary", "sourceUrl", "fitScore", and "reasoning". Do NOT include any text outside of this JSON object.`;

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        // Since we aren't enforcing a schema, parsing becomes more critical.
        res.status(200).json(safeJsonParse(response.text ?? '{"jobs":[]}'));
    } catch(error: any) {
        handleApiError(error, res, 'generate-jobs');
    }
});

aiRouter.post('/generate-cv', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, job, activeExperiments } = req.body;
    let experimentInstructions = 'No active experiments.';
    if(activeExperiments && activeExperiments.length > 0) {
        experimentInstructions = `Apply the following experimental strategies to the CV: ${activeExperiments.map((e: any) => e.method).join('. ')}`;
    }
    const prompt = `Act as a professional resume writer. Your task is to rewrite and tailor the user's Base CV to perfectly match the provided Job Description. The tailored CV should be ATS-friendly, use strong action verbs, and quantify achievements where possible.

User's Profile:
- Name: ${profile.name ?? ''}
- Summary: ${profile.summary ?? ''}
- Key Skills: ${profile.keySkills ?? ''}

Base CV Content:
---
${profile.baseCV ?? ''}
---

Target Job Description:
---
Company: ${job.company ?? ''}
Title: ${job.title ?? ''}
Description: ${job.description ?? ''}
---

Active Strategy Experiments:
${experimentInstructions}

Return ONLY the full text of the tailored CV, with no extra commentary.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, 'generate-cv');
    }
});


aiRouter.post('/generate-cover-letter', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, job } = req.body;
    const prompt = `Act as a professional career coach. Write a compelling and concise cover letter for the user, tailored to the specific job. The tone should be professional but enthusiastic.

User's Profile:
- Name: ${profile.name ?? ''}
- Summary: ${profile.summary ?? ''}
- Key Skills: ${profile.keySkills ?? ''}
- Base CV: ${profile.baseCV ?? ''}

Target Job:
- Company: ${job.company ?? ''}
- Title: ${job.title ?? ''}
- Description: ${job.description ?? ''}

Return ONLY the text of the cover letter.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, 'generate-cover-letter');
    }
});

const extractedProfileSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        summary: { type: Type.STRING },
        keySkills: { type: Type.STRING, description: "Comma-separated list of top skills." },
        jobRoles: { type: Type.STRING, description: "Comma-separated list of potential job roles." },
        locations: { type: Type.STRING, description: "Comma-separated list of locations mentioned." },
        yearsOfExperience: { type: Type.STRING },
        education: { type: Type.STRING },
        languages: { type: Type.STRING },
        certifications: { type: Type.STRING },
        extractedText: { type: Type.STRING, description: "The full, cleaned text extracted from the source." }
    }
};

aiRouter.post('/extract-profile', async (req: ExpressRequest, res: ExpressResponse) => {
    const { cvData, linkedinUrl, artifacts } = req.body;

    const instructionPart = { text: `You are an expert HR data analyst. Your task is to meticulously analyze the provided career documents and extract key information into a structured JSON object. 
    
    IMPORTANT: Do not invent or infer information that is not present in the source documents. If a field is not found, leave it as an empty string. The 'jobRoles' field should be based on titles from the CV, not generic roles. The 'locations' field should only contain cities/countries explicitly mentioned. Stick only to what's in the documents.
    
    The final 'extractedText' field should contain the full, cleaned text extracted from the CV source.
    
    Analyze the following documents. Return ONLY the structured JSON object.` };

    const requestParts: any[] = [instructionPart];

    // Add the CV data, whether it's pasted text or an uploaded file
    if (cvData?.text) {
        requestParts.push({ text: `\n\n--- CV (Pasted Text) ---\n${cvData.text}` });
    } else if (cvData?.file) {
        // This is the correct way to send a file for analysis
        requestParts.push({ inlineData: { mimeType: cvData.file.mimeType, data: cvData.file.data } });
    }

    // Add optional LinkedIn URL and artifacts
    if (linkedinUrl) {
        requestParts.push({ text: `\n\n--- LinkedIn Profile URL ---\n${linkedinUrl}` });
    }
    if (artifacts && Array.isArray(artifacts) && artifacts.length > 0) {
        const artifactsText = artifacts.map((a: any) => `Label: ${a.label}\nContent: ${a.content}`).join('\n---\n');
        requestParts.push({ text: `\n\n--- Additional Career Artifacts ---\n${artifactsText}` });
    }

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: requestParts },
            config: { responseMimeType: "application/json", responseSchema: extractedProfileSchema }
        });
        res.status(200).json(safeJsonParse(response.text ?? '{}'));
    } catch (error: any) {
        handleApiError(error, res, 'extract-profile');
    }
});

aiRouter.post('/clarifying-questions', async (req: ExpressRequest, res: ExpressResponse) => {
    const { extractedProfile } = req.body;
    const prompt = `Based on this extracted user profile, identify any vague or missing information. Formulate 2-3 friendly, concise questions to ask the user to clarify these points.
    
    Profile: ${JSON.stringify(extractedProfile) ?? ''}
    
    Return ONLY the text of the questions.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, 'clarifying-questions');
    }
});

aiRouter.post('/suggest-roles', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile } = req.body;
    const prompt = `Based on the user's profile, suggest 3-5 alternative or related job roles they might be qualified for and interested in.
    
    Profile: ${JSON.stringify(profile) ?? ''}
    
    Return a JSON object with a single key "roles" which is an array of strings.`;
    const schema = { type: Type.OBJECT, properties: { roles: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['roles'] };
     try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        res.status(200).json(safeJsonParse(response.text ?? '{"roles":[]}'));
    } catch (error: any) {
        handleApiError(error, res, 'suggest-roles');
    }
});

aiRouter.post('/interview-prep', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, application } = req.body;
    const prompt = `Generate a comprehensive but concise interview preparation kit in Markdown format for the following user and application.
    
    User Profile:
    - Role: ${profile.jobRoles ?? ''}
    - Experience: ${profile.yearsOfExperience ?? ''}
    - Summary: ${profile.summary ?? ''}

    Application:
    - Company: ${application.company ?? ''}
    - Title: ${application.title ?? ''}
    - Description: ${application.description ?? ''}

    The kit should include:
    1.  Key Company Information (mission, recent news).
    2.  Potential Interview Questions (technical and behavioral) based on the job description and user's CV.
    3.  Suggested questions for the user to ask the interviewer.

    Return ONLY the markdown text.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, 'interview-prep');
    }
});

aiRouter.post('/analyze-audio', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, application, question, audioBase64, audioMimeType } = req.body;
    
    const audioPart = { inlineData: { mimeType: audioMimeType, data: audioBase64 } };
    const textPart = { text: `A candidate is answering an interview question.
    - Question: "${question}"
    - Candidate's Role: ${profile.jobRoles ?? ''}
    - Target Job: ${application.title ?? ''} at ${application.company ?? ''}
    
    Please analyze the candidate's spoken answer (provided as audio). Provide feedback in Markdown on clarity, confidence, relevance, and structure (like the STAR method). Offer specific, constructive advice for improvement.`};
    
    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, audioPart] }
        });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, 'analyze-audio');
    }
});


aiRouter.post('/performance-insights', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, applications } = req.body;
    const prompt = `Act as an expert career strategist. Analyze the user's application history to identify patterns and suggest improvements.
    
    User Profile:
    - Target Roles: ${profile.jobRoles ?? ''}
    - Key Skills: ${profile.keySkills ?? ''}

    Application History (last 20):
    ${JSON.stringify(applications.slice(0, 20), null, 2) ?? ''}

    Based on this data:
    1.  Identify 2-3 positive patterns (e.g., "high interview rate with startups").
    2.  Identify 2-3 areas for improvement (e.g., "low response rate from jobs requiring Python").
    3.  Provide a single, proactive suggestion for the user to improve their strategy.
    4.  Propose a simple, concrete A/B experiment the agent can run (e.g., Hypothesis: "A CV summary focused on project impact will perform better.", Method: "For the next 5 applications, rewrite the CV summary to lead with project outcomes and measure response rate.").

    Return a structured JSON object.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            positivePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            proactiveSuggestion: { type: Type.STRING },
            proposal: { 
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    hypothesis: { type: Type.STRING },
                    method: { type: Type.STRING }
                },
                required: ['id', 'hypothesis', 'method']
            }
        },
        required: ['positivePatterns', 'improvementAreas', 'proactiveSuggestion']
    };

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        const parsed = safeJsonParse(response.text ?? '{}');
        if (parsed.proposal) {
            parsed.proposal.id = crypto.randomUUID();
        }
        res.status(200).json(parsed);
    } catch (error: any) {
        handleApiError(error, res, 'performance-insights');
    }
});


// Chat Endpoints
aiRouter.post('/chat/send-message', async (req: ExpressRequest, res: ExpressResponse) => {
    const { message, systemInstruction } = req.body;
    if (!message || !systemInstruction) return res.status(400).json({ message: 'Message and systemInstruction are required.' });
    
    try {
        const chat = ai!.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
        const result = await chat.sendMessage({ message });
        res.status(200).json({ text: result.text ?? '' });
    } catch(error: any) {
        handleApiError(error, res, 'chat/send-message');
    }
});

aiRouter.post('/chat/parse-command', async (req: ExpressRequest, res: ExpressResponse) => {
    const { userText } = req.body;
    const commandSchema = {
        type: Type.OBJECT,
        properties: {
            command: { type: Type.STRING, enum: ['find_jobs', 'switch_tab', 'get_status', 'none'] },
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

    const prompt = `Analyze the user's request: "${userText}"\nYour task is to determine if this is a command. If it is not a command, return "none".\nAvailable commands:\n1. 'find_jobs': Trigger a job search. Requires 'mode' parameter ('autonomous' or 'review').\n2. 'switch_tab': Navigate the app. Requires 'tab' parameter.\n3. 'get_status': Check application status. Requires 'companyName'.\nIf the user's request matches a command, return a JSON object with the command and its parameters.\nIf it's just a greeting or conversational question, return a JSON object with command "none".`;

    try {
        const response = await ai!.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: commandSchema }
        });
        res.status(200).json(safeJsonParse(response.text ?? '{"command":"none"}'));
    } catch (error: any) {
        // Safely fallback to non-command
        res.status(200).json({ command: 'none' });
    }
});

app.use('/api/ai', checkAiConnection, aiRouter);

const automationRouter = express.Router();
automationRouter.post('/easy-apply', (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ success: false, log: ['[BE-INFO] "Easy Apply" is not a real feature. This is a mock response.'] }));
automationRouter.post('/complex-apply', (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ success: false, log: ['[BE-INFO] "Complex Apply" is not a real feature. This is a mock response.'] }));
app.use('/api/automation', automationRouter);

const gdriveRouter = express.Router();
gdriveRouter.post('/save-file', (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ url: `https://docs.google.com/document/d/mock-gdrive-id/edit` }));
gdriveRouter.post('/create-sheet', (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ id: `sheet_mock_id`, url: `https://docs.google.com/spreadsheets/d/sheet_mock_id/edit` }));
gdriveRouter.post('/sync-to-sheet', (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ success: true }));
gdriveRouter.post('/sync-from-sheet', (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ applications: [] }));
app.use('/api/gdrive', gdriveRouter);


// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('[server]: IMPORTANT - Supabase environment variables not set. Database functionality will be disabled.');
  } else {
    console.log('[server]: Supabase client configured.');
  }
  if (!process.env.API_KEY) {
      console.warn('[server]: IMPORTANT - API_KEY (for Gemini) not set. AI functionality will be disabled.');
  } else {
    console.log('[server]: Gemini API key found.');
  }
});



// Profile
dataRouter.get("/profile", async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from("profiles").select("*").eq("id", DUMMY_USER_ID).single();
        if (error && error.code !== "PGRST116") { // Ignore 'single row not found' error
            return handleApiError(error, res, "getProfile");
        }
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, "getProfile");
    }
});

dataRouter.post("/profile", async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const fullProfile: { [key: string]: any } = req.body;
        
        // **CRITICAL FIX**: This is a "whitelist" of columns that are known to exist in the user's database.
        // The backend will ONLY try to save columns from this list.
        // This prevents crashes if the frontend sends data for a column that doesn't exist in the database schema.
        const KNOWN_SAFE_COLUMNS = [
            "name", "summary", "linkedinUrl", "email", "agentEmail", "agentPassword",
            "gdriveLinked", "gSheetId", "gSheetUrl", "artifacts", "minimumFitScore",
            "jobRoles", "locations", "keySkills", "yearsOfExperience", "education", 
            "languages", "certifications", "baseCV", "baseCVfilename", "autonomousMode"
        ];

        const profileToSave: { [key:string]: any } = {};
        
        KNOWN_SAFE_COLUMNS.forEach(key => {
            // Check if the incoming profile from the frontend *actually has* this key before adding it.
            if (Object.prototype.hasOwnProperty.call(fullProfile, key)) {
                profileToSave[key] = fullProfile[key];
            }
        });

        // The user ID is always required for the upsert operation to identify the correct row.
        profileToSave.id = DUMMY_USER_ID;

        const { data, error } = await supabase!.from("profiles").upsert(profileToSave).select().single();
        
        if (error) {
            console.error("Error during 'upsert' in saveProfile. This is likely due to a schema mismatch even with filtering. Error details:", error);
            return handleApiError(error, res, "saveProfile");
        }
        
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, "saveProfile");
    }
});


// Generic function for handling data sync with "Smart Save" filtering
const syncTable = async (req: ExpressRequest, res: ExpressResponse, tableName: string, coreColumns: string[]) => {
    try {
        const items = req.body;
        
        const { error: deleteError } = await supabase!.from(tableName).delete().eq("user_id", DUMMY_USER_UUID);
        if (deleteError) return handleApiError(deleteError, res, `delete from ${tableName}`);

        if (items && Array.isArray(items) && items.length > 0) {
            
            const itemsToInsert = items.map((item: any) => {
                const filteredItem: { [key: string]: any } = {};
                coreColumns.forEach(key => {
                    if (Object.prototype.hasOwnProperty.call(item, key)) {
                        filteredItem[key] = item[key];
                    }
                });
                filteredItem.user_id = DUMMY_USER_UUID;
                return filteredItem;
            });
            
            const { data, error: insertError } = await supabase!.from(tableName).insert(itemsToInsert).select();
            if (insertError) {
                console.error(`Error in insert into ${tableName}:`, insertError);
                return handleApiError(insertError, res, `insert into ${tableName}`);
            }
            return res.status(200).json(data);
        }

        return res.status(200).json([]);
    } catch (e: any) {
        handleApiError(e, res, `syncTable for ${tableName}`);
    }
};

// This list specifically EXCLUDES 'agentLog' which was reported missing in logs.
const coreApplicationColumns = [
    "id", "company", "title", "location", "description", "salary", 
    "sourceUrl", "fitScore", "reasoning", "status", "tailoredCV", 
    "coverLetter", "appliedDate", "interviewPrepKit", 
    "cvGdriveUrl", "coverLetterGdriveUrl", "rejectionReason"
];

const coreExperimentColumns = [
    "id", "hypothesis", "method", "status", "results"
];

// Applications
dataRouter.get("/applications", async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from("applications").select("*").eq("user_id", DUMMY_USER_UUID);
        if (error) return handleApiError(error, res, "getApplications");
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, "getApplications");
    }
});
dataRouter.post("/applications", (req: ExpressRequest, res: ExpressResponse) => syncTable(req, res, "applications", coreApplicationColumns));

// Experiments
dataRouter.get("/experiments", async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from("experiments").select("*").eq("user_id", DUMMY_USER_UUID);
        if (error) return handleApiError(error, res, "getExperiments");
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, "getExperiments");
    }
});
dataRouter.post("/experiments", (req: ExpressRequest, res: ExpressResponse) => syncTable(req, res, "experiments", coreExperimentColumns));

app.use("/api/data", checkDbConnection, dataRouter);


// --- Live AI and Automation Routes ---

const aiRouter = express.Router();

aiRouter.post("/generate-jobs", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile } = req.body;
    const prompt = `Act as an expert headhunter. Use your search tool to find 5 real, currently active job postings in Germany that are a strong match for the following candidate profile. For each job, provide a direct URL to the application page in the 'sourceUrl' field.\n\n    Candidate Profile:\n    - Target Roles: ${profile.jobRoles ?? ''}\n    - Target Locations: ${profile.locations ?? ''}\n    - Key Skills: ${profile.keySkills ?? ''}\n    - Experience: ${profile.yearsOfExperience ?? ''}\n    - Summary: ${profile.summary ?? ''}\n\n    Return your findings as a single JSON object with a key "jobs" which contains an array of job objects. Each job object must have these keys: "company", "title", "location", "description", "salary", "sourceUrl", "fitScore", and "reasoning". Do NOT include any text outside of this JSON object.`;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        // Since we aren't enforcing a schema, parsing becomes more critical.
        res.status(200).json(safeJsonParse(response.text ?? '{"jobs":[]}'));
    } catch(error: any) {
        handleApiError(error, res, "generate-jobs");
    }
});

aiRouter.post("/generate-cv", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, job, activeExperiments } = req.body;
    let experimentInstructions = 'No active experiments.';
    if(activeExperiments && activeExperiments.length > 0) {
        experimentInstructions = `Apply the following experimental strategies to the CV: ${activeExperiments.map((e: any) => e.method).join('. ')}`;
    }
    const prompt = `Act as a professional resume writer. Your task is to rewrite and tailor the user's Base CV to perfectly match the provided Job Description. The tailored CV should be ATS-friendly, use strong action verbs, and quantify achievements where possible.\n\nUser's Profile:\n- Name: ${profile.name ?? ''}\n- Summary: ${profile.summary ?? ''}\n- Key Skills: ${profile.keySkills ?? ''}\n\nBase CV Content:\n---\n${profile.baseCV ?? ''}\n---\n\nTarget Job Description:\n---\nCompany: ${job.company ?? ''}\nTitle: ${job.title ?? ''}\nDescription: ${job.description ?? ''}\n---\n\nActive Strategy Experiments:\n${experimentInstructions}\n\nReturn ONLY the full text of the tailored CV, with no extra commentary.`;
    try {
        const response = await ai!.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, "generate-cv");
    }
});


aiRouter.post("/generate-cover-letter", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, job } = req.body;
    const prompt = `Act as a professional career coach. Write a compelling and concise cover letter for the user, tailored to the specific job. The tone should be professional but enthusiastic.\n\nUser's Profile:\n- Name: ${profile.name ?? ''}\n- Summary: ${profile.summary ?? ''}\n- Key Skills: ${profile.keySkills ?? ''}\n- Base CV: ${profile.baseCV ?? ''}\n\nTarget Job:\n- Company: ${job.company ?? ''}\n- Title: ${job.title ?? ''}\n- Description: ${job.description ?? ''}\n\nReturn ONLY the text of the cover letter.`;
    try {
        const response = await ai!.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, "generate-cover-letter");
    }
});

const extractedProfileSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        summary: { type: Type.STRING },
        keySkills: { type: Type.STRING, description: "Comma-separated list of top skills." },
        jobRoles: { type: Type.STRING, description: "Comma-separated list of potential job roles." },
        locations: { type: Type.STRING, description: "Comma-separated list of locations mentioned." },
        yearsOfExperience: { type: Type.STRING },
        education: { type: Type.STRING },
        languages: { type: Type.STRING },
        certifications: { type: Type.STRING },
        extractedText: { type: Type.STRING, description: "The full, cleaned text extracted from the source." }
    }
};

aiRouter.post("/extract-profile", async (req: ExpressRequest, res: ExpressResponse) => {
    const { cvData, linkedinUrl, artifacts } = req.body;

    const instructionPart = { text: `You are an expert HR data analyst. Your task is to meticulously analyze the provided career documents and extract key information into a structured JSON object. \n    \n    IMPORTANT: Do not invent or infer information that is not present in the source documents. If a field is not found, leave it as an empty string. The 'jobRoles' field should be based on titles from the CV, not generic roles. The 'locations' field should only contain cities/countries explicitly mentioned. Stick only to what's in the documents.\n    \n    The final 'extractedText' field should contain the full, cleaned text extracted from the CV source.\n    \n    Analyze the following documents. Return ONLY the structured JSON object.` };

    const requestParts: any[] = [instructionPart];

    // Add the CV data, whether it's pasted text or an uploaded file
    if (cvData?.text) {
        requestParts.push({ text: `\n\n--- CV (Pasted Text) ---\n${cvData.text}` });
    } else if (cvData?.file) {
        // This is the correct way to send a file for analysis
        requestParts.push({ inlineData: { mimeType: cvData.file.mimeType, data: cvData.file.data } });
    }

    // Add optional LinkedIn URL and artifacts
    if (linkedinUrl) {
        requestParts.push({ text: `\n\n--- LinkedIn Profile URL ---\n${linkedinUrl}` });
    }
    if (artifacts && Array.isArray(artifacts) && artifacts.length > 0) {
        const artifactsText = artifacts.map((a: any) => `Label: ${a.label}\nContent: ${a.content}`).join('\n---\n');
        requestParts.push({ text: `\n\n--- Additional Career Artifacts ---\n${artifactsText}` });
    }

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: requestParts },
            config: { responseMimeType: "application/json", responseSchema: extractedProfileSchema }
        });
        res.status(200).json(safeJsonParse(response.text ?? '{}'));
    } catch (error: any) {
        handleApiError(error, res, "extract-profile");
    }
});

aiRouter.post("/clarifying-questions", async (req: ExpressRequest, res: ExpressResponse) => {
    const { extractedProfile } = req.body;
    const prompt = `Based on this extracted user profile, identify any vague or missing information. Formulate 2-3 friendly, concise questions to ask the user to clarify these points.\n    \n    Profile: ${JSON.stringify(extractedProfile) ?? ''}\n    \n    Return ONLY the text of the questions.`;
    try {
        const response = await ai!.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, "clarifying-questions");
    }
});

aiRouter.post("/suggest-roles", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile } = req.body;
    const prompt = `Based on the user's profile, suggest 3-5 alternative or related job roles they might be qualified for and interested in.\n    \n    Profile: ${JSON.stringify(profile) ?? ''}\n    \n    Return a JSON object with a single key "roles" which is an array of strings.`;
    const schema = {
        type: Type.OBJECT,
        properties: { roles: { type: Type.ARRAY, items: { type: Type.STRING } } },
        required: ["roles"]
    };
     try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        res.status(200).json(safeJsonParse(response.text ?? '{"roles":[]}'));
    } catch (error: any) {
        handleApiError(error, res, "suggest-roles");
    }
});

aiRouter.post("/interview-prep", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, application } = req.body;
    const prompt = `Generate a comprehensive but concise interview preparation kit in Markdown format for the following user and application.\n    \n    User Profile:\n    - Role: ${profile.jobRoles ?? ''}\n    - Experience: ${profile.yearsOfExperience ?? ''}\n    - Summary: ${profile.summary ?? ''}\n
    Application:\n    - Company: ${application.company ?? ''}\n    - Title: ${application.title ?? ''}\n    - Description: ${application.description ?? ''}\n
    The kit should include:\n    1.  Key Company Information (mission, recent news).\n    2.  Potential Interview Questions (technical and behavioral) based on the job description and user's CV.\n    3.  Suggested questions for the user to ask the interviewer.\n
    Return ONLY the markdown text.`;
    try {
        const response = await ai!.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, "interview-prep");
    }
});

aiRouter.post("/analyze-audio", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, application, question, audioBase64, audioMimeType } = req.body;
    
    const audioPart = { inlineData: { mimeType: audioMimeType, data: audioBase64 } };
    const textPart = { text: `A candidate is answering an interview question.\n    - Question: "${question}"\n    - Candidate's Role: ${profile.jobRoles ?? ''}\n    - Target Job: ${application.title ?? ''} at ${application.company ?? ''}\n    \n    Please analyze the candidate's spoken answer (provided as audio). Provide feedback in Markdown on clarity, confidence, relevance, and structure (like the STAR method). Offer specific, constructive advice for improvement.`};
    
    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [textPart, audioPart] }
        });
        res.status(200).json({ text: response.text ?? '' });
    } catch (error: any) {
        handleApiError(error, res, "analyze-audio");
    }
});


aiRouter.post("/performance-insights", async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, applications } = req.body;
    const prompt = `Act as an expert career strategist. Analyze the user's application history to identify patterns and suggest improvements.\n    \n    User Profile:\n    - Target Roles: ${profile.jobRoles ?? ''}\n    - Key Skills: ${profile.keySkills ?? ''}\n
    Application History (last 20):\n    ${JSON.stringify(applications.slice(0, 20), null, 2) ?? ''}\n
    Based on this data:\n    1.  Identify 2-3 positive patterns (e.g., "high interview rate with startups").\n    2.  Identify 2-3 areas for improvement (e.g., "low response rate from jobs requiring Python").\n    3.  Provide a single, proactive suggestion for the user to improve their strategy.\n    4.  Propose a simple, concrete A/B experiment the agent can run (e.g., Hypothesis: "A CV summary focused on project impact will perform better.", Method: "For the next 5 applications, rewrite the CV summary to lead with project outcomes and measure response rate.").\n
    Return a structured JSON object.`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            positivePatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            proactiveSuggestion: { type: Type.STRING },
            proposal: { 
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    hypothesis: { type: Type.STRING },
                    method: { type: Type.STRING }
                },
                required: ["id", "hypothesis", "method"]
            }
        },
        required: ["positivePatterns", "improvementAreas", "proactiveSuggestion"]
    };

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        const parsed = safeJsonParse(response.text ?? '{}');
        if (parsed.proposal) {
            parsed.proposal.id = crypto.randomUUID();
        }
        res.status(200).json(parsed);
    } catch (error: any) {
        handleApiError(error, res, "performance-insights");
    }
});


// Chat Endpoints
aiRouter.post("/chat/send-message", async (req: ExpressRequest, res: ExpressResponse) => {
    const { message, systemInstruction } = req.body;
    if (!message || !systemInstruction) return res.status(400).json({ message: 'Message and systemInstruction are required.' });
    
    try {
        const chat = ai!.chats.create({ model: "gemini-2.5-flash", config: { systemInstruction } });
        const result = await chat.sendMessage({ message });
        res.status(200).json({ text: result.text ?? '' });
    } catch(error: any) {
        handleApiError(error, res, "chat/send-message");
    }
});

aiRouter.post("/chat/parse-command", async (req: ExpressRequest, res: ExpressResponse) => {
    const { userText } = req.body;
    const commandSchema = {
        type: Type.OBJECT,
        properties: {
            command: { type: Type.STRING, enum: ["find_jobs", "switch_tab", "get_status", "none"] },
            params: {
                type: Type.OBJECT,
                properties: {
                    mode: { type: Type.STRING, enum: ["autonomous", "review"] },
                    tab: { type: Type.STRING, enum: ["Dashboard", "Find Jobs", "My Applications", "Reports", "My Profile", "Doc Generator"] },
                    companyName: { type: Type.STRING }
                },
                nullable: true,
            }
        },
        required: ["command"]
    };

    const prompt = `Analyze the user's request: "${userText}"\nYour task is to determine if this is a command. If it is not a command, return "none".\nAvailable commands:\n1. 'find_jobs': Trigger a job search. Requires 'mode' parameter ('autonomous' or 'review').\n2. 'switch_tab': Navigate the app. Requires 'tab' parameter.\n3. 'get_status': Check application status. Requires 'companyName'.\nIf the user's request matches a command, return a JSON object with the command and its parameters.\nIf it's just a greeting or conversational question, return a JSON object with command "none".`;

    try {
        const response = await ai!.models.generateContent({
            model: "gemini-2.5-flash", contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: commandSchema }
        });
        res.status(200).json(safeJsonParse(response.text ?? '{"command":"none"}'));
    } catch (error: any) {
        // Safely fallback to non-command
        res.status(200).json({ command: "none" });
    }
});

app.use("/api/ai", checkAiConnection, aiRouter);

const automationRouter = express.Router();
automationRouter.post("/easy-apply", (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ success: false, log: ['[BE-INFO] "Easy Apply" is not a real feature. This is a mock response.'] }));
automationRouter.post("/complex-apply", (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ success: false, log: ['[BE-INFO] "Complex Apply" is not a real feature. This is a mock response.'] }));
app.use("/api/automation", automationRouter);

const gdriveRouter = express.Router();
gdriveRouter.post("/save-file", (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ url: `https://docs.google.com/document/d/mock-gdrive-id/edit` }));
gdriveRouter.post("/create-sheet", (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ id: `sheet_mock_id`, url: `https://docs.google.com/spreadsheets/d/sheet_mock_id/edit` }));
gdriveRouter.post("/sync-to-sheet", (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ success: true }));
gdriveRouter.post("/sync-from-sheet", (req: ExpressRequest, res: ExpressResponse) => res.status(200).json({ applications: [] }));
app.use("/api/gdrive", gdriveRouter);


// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn("[server]: IMPORTANT - Supabase environment variables not set. Database functionality will be disabled.");
  } else {
    console.log("[server]: Supabase client configured.");
  }
  if (!process.env.API_KEY) {
      console.warn("[server]: IMPORTANT - API_KEY (for Gemini) not set. AI functionality will be disabled.");
  } else {
    console.log("[server]: Gemini API key found.");
  }
});


