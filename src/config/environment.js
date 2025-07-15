// Environment configuration for AI Job Copilot

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

const config = {
  isDevelopment,
  isProduction,
  
  // API Configuration
  api: {
    baseUrl: isProduction 
      ? 'https://ai-job-copilot.onrender.com'
      : 'http://localhost:5000',
    
    endpoints: {
      // Data endpoints
      profile: '/api/profile',
      applications: '/api/applications',
      experiments: '/api/experiments',
      
      // AI endpoints
      extractProfile: '/api/ai/analyze-cv',
      generateJobs: '/api/jobs/search',
      generateCV: '/api/ai/generate-cv',
      generateCoverLetter: '/api/ai/cover-letter',
      generateInterviewPrep: '/api/ai/interview-prep',
      analyzePerformance: '/api/analytics',
      analyzeAudio: '/api/ai/analyze-audio',
      
      // Automation endpoints
      easyApply: '/api/automation/apply',
      complexApply: '/api/automation/apply',
      
      // Google Drive endpoints
      saveFile: '/api/gdrive/save-file',
      createSheet: '/api/gdrive/create-sheet',
      syncSheet: '/api/gdrive/sync-sheet'
    }
  },
  
  // Feature flags
  features: {
    autonomousMode: true,
    webAutomation: true,
    googleDriveIntegration: true,
    mockInterviews: true,
    performanceAnalytics: true,
    abTesting: true
  },
  
  // Job search configuration
  jobSearch: {
    defaultLocation: 'Germany',
    supportedSources: ['stepstone.de', 'indeed.de', 'xing.de'],
    maxResults: 50,
    fitScoreThreshold: 70,
    autoApplyThreshold: 85
  },
  
  // UI Configuration
  ui: {
    theme: 'dark',
    animations: true,
    notifications: true,
    autoSave: true,
    autoSaveInterval: 30000 // 30 seconds
  }
};

export default config;

