import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import { supabase } from './supabaseClient';
import { GoogleGenAI, Type } from '@google/genai';

console.log('[server]: SUPABASE_URL from env:', process.env.SUPABASE_URL);
console.log('[server]: SUPABASE_ANON_KEY from env:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

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
            'name', 'summary', 'linkedinurl', 'email', 'agentemail', 'agentpassword',
            'gdrivelinked', 'gsheetid', 'gsheeturl', 'artifacts', 'minimumfitscore',
            'jobroles', 'locations', 'keyskills', 'yearsofexperience', 'education', 
            'languages', 'certifications', 'basecv', 'basecvfilename', 'autonomousmode'
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
    'id', 'job_title', 'company', 'location', 'job_description', 'salary_range', 
    'job_url', 'fit_score', 'status', 'application_date', 'method', 
    'cover_letter', 'customized_cv', 'rejection_reason'
];

const coreExperimentColumns = [
    'id', 'name', 'description', 'status', 'start_date', 'experiment_type'
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
            range: req.query.range || '30d',
            totalApplications: 0,
            responseRate: 0,
            interviewRate: 0,
            successRate: 0,
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

    Return your response as a JSON object with a key "questions" containing an array of question strings.`;
    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json(safeJsonParse(response.text ?? '{"questions":[]}'));
    } catch (error: any) {
        handleApiError(error, res, 'clarifying-questions');
    }
});

aiRouter.post('/generate-interview-prep', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, job } = req.body;
    const prompt = `Act as a senior HR professional and interview coach. Create a comprehensive interview preparation kit for the following job application.

User's Profile:
- Name: ${profile.name ?? ''}
- Summary: ${profile.summary ?? ''}
- Key Skills: ${profile.keySkills ?? ''}
- Experience: ${profile.yearsOfExperience ?? ''}

Target Job:
- Company: ${job.company ?? ''}
- Title: ${job.title ?? ''}
- Description: ${job.description ?? ''}

Create a JSON response with the following structure:
{
  "companyResearch": "Brief company background and culture insights",
  "roleAnalysis": "Key responsibilities and requirements breakdown",
  "likelyQuestions": ["Array of 8-10 likely interview questions"],
  "suggestedAnswers": ["Array of suggested answer frameworks for each question"],
  "questionsToAsk": ["Array of 5-6 thoughtful questions to ask the interviewer"],
  "preparationTips": ["Array of 5-7 specific preparation tips"]
}`;

    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json(safeJsonParse(response.text ?? '{}'));
    } catch (error: any) {
        handleApiError(error, res, 'generate-interview-prep');
    }
});

aiRouter.post('/analyze-job-fit', async (req: ExpressRequest, res: ExpressResponse) => {
    const { profile, jobDescription } = req.body;
    const prompt = `Act as an expert career counselor. Analyze how well this candidate profile matches the given job description.

Candidate Profile:
- Summary: ${profile.summary ?? ''}
- Key Skills: ${profile.keySkills ?? ''}
- Experience: ${profile.yearsOfExperience ?? ''}
- Education: ${profile.education ?? ''}

Job Description:
${jobDescription ?? ''}

Provide a detailed analysis in JSON format:
{
  "fitScore": 85,
  "strengths": ["Array of matching qualifications and skills"],
  "gaps": ["Array of missing or weak areas"],
  "recommendations": ["Array of suggestions to improve candidacy"],
  "reasoning": "Detailed explanation of the fit score"
}`;

    try {
        const response = await ai!.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        res.status(200).json(safeJsonParse(response.text ?? '{}'));
    } catch (error: any) {
        handleApiError(error, res, 'analyze-job-fit');
    }
});

app.use('/api/ai', checkAiConnection, aiRouter);

// --- Automation Routes ---
const automationRouter = express.Router();

automationRouter.post('/schedule-application', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { jobId, scheduledTime, applicationData } = req.body;
        
        // Create automation task
        const task = {
            id: `auto_${Date.now()}`,
            user_id: DUMMY_USER_UUID,
            task_type: 'application_submit',
            status: 'pending',
            parameters: {
                jobId,
                scheduledTime,
                applicationData
            },
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase!.from('automation_tasks').insert(task).select().single();
        
        if (error) {
            return handleApiError(error, res, 'schedule-application');
        }
        
        res.status(200).json(data);
    } catch (error: any) {
        handleApiError(error, res, 'schedule-application');
    }
});

automationRouter.get('/tasks', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { data, error } = await supabase!.from('automation_tasks').select('*').eq('user_id', DUMMY_USER_UUID);
        if (error) return handleApiError(error, res, 'get-automation-tasks');
        res.status(200).json(data);
    } catch (e: any) {
        handleApiError(e, res, 'get-automation-tasks');
    }
});

automationRouter.post('/execute-task/:taskId', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { taskId } = req.params;
        
        // Update task status to running
        const { error: updateError } = await supabase!
            .from('automation_tasks')
            .update({ 
                status: 'running', 
                started_at: new Date().toISOString() 
            })
            .eq('id', taskId);
            
        if (updateError) {
            return handleApiError(updateError, res, 'execute-task-update');
        }
        
        // Mock execution logic - in real implementation, this would handle the actual automation
        setTimeout(async () => {
            const { error: completeError } = await supabase!
                .from('automation_tasks')
                .update({ 
                    status: 'completed', 
                    completed_at: new Date().toISOString(),
                    progress: 100,
                    results: { message: 'Task completed successfully' }
                })
                .eq('id', taskId);
                
            if (completeError) {
                console.error('Error completing task:', completeError);
            }
        }, 5000); // Simulate 5 second execution
        
        res.status(200).json({ message: 'Task execution started', taskId });
    } catch (error: any) {
        handleApiError(error, res, 'execute-task');
    }
});

// Google Drive integration routes
const gdriveRouter = express.Router();

gdriveRouter.post('/upload', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { fileName, content, folderId } = req.body;
        
        // Mock implementation for Google Drive upload
        // In a real implementation, this would use Google Drive API
        const mockGdriveUrl = `https://drive.google.com/file/d/mock-file-id-${Date.now()}/view`;
        
        res.status(200).json({
            success: true,
            url: mockGdriveUrl,
            fileName: fileName,
            folderId: folderId || 'root'
        });
    } catch (error: any) {
        handleApiError(error, res, 'gdrive-upload');
    }
});

gdriveRouter.post('/create-folder', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { folderName, parentFolderId } = req.body;
        
        // Mock implementation for Google Drive folder creation
        const mockFolderId = `folder-${Date.now()}`;
        const mockFolderUrl = `https://drive.google.com/drive/folders/${mockFolderId}`;
        
        res.status(200).json({
            success: true,
            folderId: mockFolderId,
            folderUrl: mockFolderUrl,
            folderName: folderName
        });
    } catch (error: any) {
        handleApiError(error, res, 'gdrive-create-folder');
    }
});

gdriveRouter.get('/files', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { folderId } = req.query;
        
        // Mock implementation for listing Google Drive files
        const mockFiles = [
            {
                id: 'file1',
                name: 'Resume_John_Doe.pdf',
                mimeType: 'application/pdf',
                webViewLink: 'https://drive.google.com/file/d/file1/view',
                createdTime: new Date().toISOString()
            },
            {
                id: 'file2',
                name: 'Cover_Letter_TechCorp.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                webViewLink: 'https://drive.google.com/file/d/file2/view',
                createdTime: new Date().toISOString()
            }
        ];
        
        res.status(200).json({
            files: mockFiles,
            folderId: folderId || 'root'
        });
    } catch (error: any) {
        handleApiError(error, res, 'gdrive-list-files');
    }
});

automationRouter.use('/gdrive', gdriveRouter);

// Job search automation routes
automationRouter.post('/search-jobs', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { searchCriteria, platforms } = req.body;
        
        // Create automation task for job search
        const task = {
            id: `search_${Date.now()}`,
            user_id: DUMMY_USER_UUID,
            task_type: 'job_search',
            status: 'pending',
            parameters: {
                searchCriteria,
                platforms: platforms || ['stepstone.de', 'indeed.de', 'xing.com']
            },
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase!.from('automation_tasks').insert(task).select().single();
        
        if (error) {
            return handleApiError(error, res, 'search-jobs');
        }
        
        res.status(200).json(data);
    } catch (error: any) {
        handleApiError(error, res, 'search-jobs');
    }
});

automationRouter.post('/bulk-apply', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { jobIds, applicationTemplate } = req.body;
        
        // Create automation task for bulk application
        const task = {
            id: `bulk_${Date.now()}`,
            user_id: DUMMY_USER_UUID,
            task_type: 'application_submit',
            status: 'pending',
            parameters: {
                jobIds,
                applicationTemplate,
                bulkMode: true
            },
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase!.from('automation_tasks').insert(task).select().single();
        
        if (error) {
            return handleApiError(error, res, 'bulk-apply');
        }
        
        res.status(200).json(data);
    } catch (error: any) {
        handleApiError(error, res, 'bulk-apply');
    }
});

app.use('/api/automation', checkDbConnection, automationRouter);

// --- Analytics and Reporting Routes ---
const analyticsRouter = express.Router();

analyticsRouter.get('/dashboard', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { range = '30d' } = req.query;
        
        // Mock analytics dashboard data
        const dashboardData = {
            range,
            summary: {
                totalApplications: 25,
                responseRate: 32,
                interviewRate: 12,
                offerRate: 4
            },
            trends: {
                applications: [5, 8, 3, 7, 2, 9, 4],
                responses: [1, 2, 1, 3, 0, 2, 1]
            },
            topPlatforms: [
                { name: 'StepStone', applications: 12, responses: 4 },
                { name: 'Indeed', applications: 8, responses: 2 },
                { name: 'XING', applications: 5, responses: 2 }
            ],
            recentActivity: [
                { type: 'application', company: 'TechCorp', date: new Date().toISOString() },
                { type: 'response', company: 'StartupXYZ', date: new Date().toISOString() }
            ]
        };
        
        res.status(200).json(dashboardData);
    } catch (error: any) {
        handleApiError(error, res, 'analytics-dashboard');
    }
});

analyticsRouter.get('/performance', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const performanceData = {
            averageResponseTime: 7.5,
            bestPerformingSkills: ['Python', 'React', 'Machine Learning'],
            improvementAreas: ['Cover letter personalization', 'Application timing'],
            successFactors: [
                'Applications sent on Tuesday-Thursday show 23% higher response rate',
                'Personalized cover letters increase response rate by 18%',
                'Applications to companies with 50-200 employees show best success rate'
            ]
        };
        
        res.status(200).json(performanceData);
    } catch (error: any) {
        handleApiError(error, res, 'analytics-performance');
    }
});

app.use('/api/analytics', checkDbConnection, analyticsRouter);

// Start the server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
