// Environment configuration for AI Job Copilot
// Updated: 2025-07-26 - Fixed API endpoint paths for data endpoints

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

const config = {
  isDevelopment,
  isProduction,
  
  // API Configuration
  api: {
    baseUrl: 'https://ai-job-copilot.onrender.com',
    
    endpoints: {
      // Health check
      health: '/api/health',
      
      // Analytics endpoint
      analytics: '/api/analytics',
      
      // Data endpoints
      profile: '/api/data/profile',
      applications: '/api/data/applications',
      experiments: '/api/data/experiments',
      
      // AI endpoints
      extractProfile: '/api/ai/extract-profile',  // Main endpoint for CV analysis
      suggestRoles: '/api/ai/suggest-roles',      // Get AI role suggestions
      generateJobs: '/api/ai/generate-jobs',      // Generate matching jobs
      generateCV: '/api/ai/generate-cv',          // Generate CV from profile
      generateCoverLetter: '/api/ai/generate-cover-letter',
      interviewPrep: '/api/ai/interview-prep',
      analyzePerformance: '/api/ai/performance-insights',
      analyzeAudio: '/api/ai/analyze-audio',
      
      // Automation endpoints
      easyApply: '/api/automation/easy-apply',
      complexApply: '/api/automation/complex-apply',
      
      // Google Drive endpoints
      saveFile: '/api/gdrive/save-file',
      createSheet: '/api/gdrive/create-sheet',
      syncSheet: '/api/gdrive/sync-to-sheet'
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

