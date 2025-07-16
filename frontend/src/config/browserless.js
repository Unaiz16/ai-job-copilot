// Browserless.io configuration for web automation
// This will be used in Phase 9 for real web automation

const browserlessConfig = {
  apiKey: '2ScPWInlwijme789fa327905e827c9f18bcbf40355a447270',
  baseUrl: 'https://chrome.browserless.io',
  
  // Configuration for different automation scenarios
  scenarios: {
    easyApply: {
      timeout: 30000,
      waitUntil: 'networkidle2',
      viewport: { width: 1920, height: 1080 }
    },
    complexApply: {
      timeout: 60000,
      waitUntil: 'networkidle2',
      viewport: { width: 1920, height: 1080 }
    },
    jobScraping: {
      timeout: 20000,
      waitUntil: 'domcontentloaded',
      viewport: { width: 1920, height: 1080 }
    }
  },
  
  // Headers for API requests
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer 2ScPWInlwijme789fa327905e827c9f18bcbf40355a447270`
  }
};

export default browserlessConfig;

