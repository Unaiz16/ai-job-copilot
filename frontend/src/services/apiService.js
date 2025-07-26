// Comprehensive API service for AI Job Copilot backend integration
import config from '../config/environment.js';

class APIService {
  constructor() {
    this.baseURL = config.api.base;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Bind all methods to ensure proper 'this' context
    this.request = this.request.bind(this);
    this.getMockData = this.getMockData.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.uploadCV = this.uploadCV.bind(this);
    this.analyzeCV = this.analyzeCV.bind(this);
    this.searchJobs = this.searchJobs.bind(this);
    this.getJobDetails = this.getJobDetails.bind(this);
    this.calculateFitScore = this.calculateFitScore.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.submitApplication = this.submitApplication.bind(this);
    this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
    this.generateCoverLetter = this.generateCoverLetter.bind(this);
    this.getAnalytics = this.getAnalytics.bind(this);
    this.getExperiments = this.getExperiments.bind(this);
    this.createExperiment = this.createExperiment.bind(this);
    this.updateExperiment = this.updateExperiment.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.executeCommand = this.executeCommand.bind(this);
    this.startAutomation = this.startAutomation.bind(this);
    this.getAutomationStatus = this.getAutomationStatus.bind(this);
    this.cancelAutomation = this.cancelAutomation.bind(this);
    this.testAutomation = this.testAutomation.bind(this);
    this.automateApplication = this.automateApplication.bind(this);
    this.detectApplicationType = this.detectApplicationType.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  // Generic API request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const requestOptions = {
      headers: this.headers,
      ...options
    };

    try {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      // Return mock data for development/testing
      return this.getMockData(endpoint, options.method);
    }
  }

  // Mock data for development/testing when backend is unavailable
  getMockData(endpoint, method) {
    const mockResponses = {
      '/api/data/profile': {
        id: 1,
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        locations: ['Berlin', 'Munich'],
        experience: '5 years',
        skills: ['Python', 'React', 'Node.js', 'Machine Learning'],
        summary: 'Experienced software developer with expertise in full-stack development and AI.',
        completeness: 85,
        careerDnaScore: 78
      },
      '/api/jobs/search': {
        jobs: [
          {
            id: 1,
            title: 'Senior Python Developer',
            company: 'TechCorp GmbH',
            location: 'Berlin',
            salary: '€70,000 - €90,000',
            source: 'stepstone.de',
            fitScore: 92,
            easyApply: true,
            description: 'We are looking for a senior Python developer...',
            requirements: ['Python', 'Django', 'PostgreSQL'],
            posted: '2024-01-15'
          },
          {
            id: 2,
            title: 'Full Stack Developer',
            company: 'StartupXYZ',
            location: 'Munich',
            salary: '€60,000 - €80,000',
            source: 'indeed.de',
            fitScore: 87,
            easyApply: false,
            description: 'Join our dynamic team as a full stack developer...',
            requirements: ['React', 'Node.js', 'MongoDB'],
            posted: '2024-01-14'
          }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      },
      '/api/data/applications': {
        applications: [
          {
            id: 1,
            jobId: 1,
            jobTitle: 'Senior Python Developer',
            company: 'TechCorp GmbH',
            status: 'interviewing',
            appliedDate: '2024-01-16',
            fitScore: 92,
            method: 'easy_apply',
            responseTime: 2,
            nextAction: 'Prepare for technical interview'
          },
          {
            id: 2,
            jobId: 2,
            jobTitle: 'Full Stack Developer',
            company: 'StartupXYZ',
            status: 'submitted',
            appliedDate: '2024-01-15',
            fitScore: 87,
            method: 'complex_apply',
            responseTime: null,
            nextAction: 'Follow up in 3 days'
          }
        ]
      },
      '/api/data/analytics': {
        totalApplications: 24,
        responseRate: 32.5,
        interviewRate: 18.2,
        averageResponseTime: 4.2,
        platforms: [
          { name: 'StepStone.de', applications: 8, responses: 3, rate: 37.5 },
          { name: 'Indeed.de', applications: 6, responses: 2, rate: 33.3 },
          { name: 'LinkedIn.de', applications: 5, responses: 2, rate: 40.0 },
          { name: 'Xing.com', applications: 5, responses: 1, rate: 20.0 }
        ],
        skills: [
          { skill: 'Python', applications: 12, interviews: 4, rate: 33.3 },
          { skill: 'React', applications: 8, interviews: 3, rate: 37.5 },
          { skill: 'Node.js', applications: 6, interviews: 2, rate: 33.3 },
          { skill: 'Machine Learning', applications: 4, interviews: 2, rate: 50.0 }
        ]
      }
    };

    // Return appropriate mock data based on endpoint
    for (const [path, data] of Object.entries(mockResponses)) {
      if (endpoint.includes(path.split('/').pop())) {
        return data;
      }
    }

    return { success: true, message: 'Mock response' };
  }

  // Profile API methods
  async getProfile() {
    return this.request('/api/data/profile');
  }

  async updateProfile(profileData) {
    return this.request('/api/data/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async uploadCV(file) {
    const formData = new FormData();
    formData.append('cv', file);
    
    return this.request('/api/profile/cv', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData
    });
  }

  async analyzeCV(cvData) {
    return this.request('/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({ cvData })
    });
  }

  // Job Search API methods
  async searchJobs(searchParams) {
    const queryString = new URLSearchParams(searchParams).toString();
    return this.request(`/api/jobs/search?${queryString}`);
  }

  async getJobDetails(jobId) {
    return this.request(`/api/jobs/${jobId}`);
  }

  async calculateFitScore(jobId, profileId) {
    return this.request('/api/ai/fit-score', {
      method: 'POST',
      body: JSON.stringify({ jobId, profileId })
    });
  }

  // Application API methods
  async getApplications() {
    return this.request('/api/data/applications');
  }

  async submitApplication(applicationData) {
    return this.request('/api/data/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
  }

  async updateApplicationStatus(applicationId, status) {
    return this.request(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async generateCoverLetter(jobId, profileId) {
    return this.request('/api/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ jobId, profileId })
    });
  }

  // Analytics API methods
  async getAnalytics(timeRange = '30d') {
    return this.request(`/api/analytics?range=${timeRange}`);
  }

  async getExperiments() {
    return this.request('/api/data/experiments');
  }

  async createExperiment(experimentData) {
    return this.request('/api/data/experiments', {
      method: 'POST',
      body: JSON.stringify(experimentData)
    });
  }

  async updateExperiment(experimentId, data) {
    return this.request(`/api/experiments/${experimentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // AI Assistant API methods
  async sendMessage(message, context = {}) {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }

  async executeCommand(command, parameters = {}) {
    return this.request('/api/ai/command', {
      method: 'POST',
      body: JSON.stringify({ command, parameters })
    });
  }

  // Web Automation API methods (for Browserless.io integration  // Automation methods
  async startAutomation(profile, searchParams, options) {
    return this.request('/api/automation/start', {
      method: 'POST',
      body: JSON.stringify({ profile, searchParams, options })
    });
  }

  async getAutomationStatus(automationId) {
    return this.request(`/api/automation/status/${automationId}`);
  }

  async cancelAutomation(automationId) {
    return this.request(`/api/automation/cancel/${automationId}`, {
      method: 'POST'
    });
  }

  async testAutomation() {
    return this.request('/api/automation/test');
  }

  async automateApplication(jobId, applicationData) {
    return this.request('/api/automation/apply', {
      method: 'POST',
      body: JSON.stringify({ jobId, applicationData })
    });
  }

  async detectApplicationType(jobUrl) {
    return this.request('/api/automation/detect', {
      method: 'POST',
      body: JSON.stringify({ jobUrl })
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.request('/api/health');
      return { status: 'connected', ...response };
    } catch (error) {
      return { status: 'disconnected', error: error.message };
    }
  }
}

// Export singleton instance
export default new APIService();

