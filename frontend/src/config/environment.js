// Environment configuration for AI Job Copilot

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

const config = {
  isDevelopment,
  isProduction,
  
  // API Configuration
  api: {
    base: isProduction 
      ? 'https://ai-job-copilot.onrender.com'
      : 'https://ai-job-copilot.onrender.com',
    
    endpoints: {
      // Data endpoints
      profile: '/api/data/profile',
      applications: '/api/data/applications',
      experiments: '/api/data/experiments',
      
      // AI endpoints
      extractProfile: '/api/ai/extract-profile',
      generateJobs: '/api/ai/generate-jobs',
      generateCV: '/api/ai/generate-cv',
      generateCoverLetter: '/api/ai/generate-cover-letter',
      generateInterviewPrep: '/api/ai/interview-prep',
      analyzePerformance: '/api/data/analytics',
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

