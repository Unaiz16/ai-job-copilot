import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, AgentMode } from './types/index.js';
import Header from './components/layout/Header.jsx';
import Navigation from './components/layout/Navigation.jsx';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';
import ProfilePage from './components/pages/ProfilePage.jsx';
import JobSearchPage from './components/pages/JobSearchPage.jsx';
import ApplicationsPage from './components/pages/ApplicationsPage.jsx';
import InterviewPage from './components/pages/InterviewPage.jsx';
import AnalyticsPage from './components/pages/AnalyticsPage.jsx';
import AIAssistant from './components/ai/AIAssistant.jsx';
import { useAPI, useProfile, useApplications, useAnalytics } from './hooks/useAPI.js';
import config from './config/environment.js';
import './App.css';

const defaultProfile = {
  id: null,
  name: '',
  email: '',
  summary: '',
  baseCV: '',
  baseCVfilename: '',
  jobRoles: '',
  locations: 'Germany',
  keySkills: '',
  yearsOfExperience: '',
  education: '',
  languages: '',
  certifications: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  autonomousMode: false,
  gdriveLinked: false,
  gSheetId: '',
  gSheetUrl: '',
  agentEmail: '',
  agentPassword: '',
  artifacts: [],
  profileCompleteness: 0,
  lastAnalyzed: null,
  careerDnaScore: 0
};

function App() {
  // Core state
  const [activeTab, setActiveTab] = useState(ActiveTab.PROFILE);
  const [agentMode, setAgentMode] = useState(AgentMode.REVIEW_FIRST);
  const [isLoading, setIsLoading] = useState(true);
  
  // API hooks for data management
  const api = useAPI();
  const { profile, loading: profileLoading, updateProfile, refreshProfile } = useProfile();
  const { applications, loading: applicationsLoading, submitApplication, updateApplicationStatus, refreshApplications } = useApplications();
  const { analytics, experiments, loading: analyticsLoading } = useAnalytics();
  
  // Additional state for UI
  const [jobs, setJobs] = useState([]);
  const [agentMessages, setAgentMessages] = useState([]);
  const [commandHandlers, setCommandHandlers] = useState({});
  
  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check backend connection
        await api.checkConnection();
        
        // Wait a bit for all hooks to initialize
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Even if backend fails, show the app with mock data
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  // Add agent message
  const addAgentMessage = useCallback((message) => {
    setAgentMessages(prev => [...prev, {
      id: Date.now(),
      message,
      timestamp: new Date(),
      type: 'info'
    }]);
  }, []);

  // Save profile
  const saveProfile = useCallback(async (profileData) => {
    try {
      // Save to localStorage
      localStorage.setItem('aiJobCopilotProfile', JSON.stringify(profileData));
      
      // In a real app, this would save to backend
      // const response = await fetch(`${config.api.baseUrl}/profile`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData)
      // });
      
      return true;
    } catch (error) {
      console.error('Failed to save profile:', error);
      return false;
    }
  }, []);

  // Handle command execution from AI Assistant
  const handleCommandExecution = useCallback((command, params) => {
    if (commandHandlers[command]) {
      commandHandlers[command](params);
    }
  }, [commandHandlers]);

  // Register command handler
  const registerCommandHandler = useCallback((command, handler) => {
    setCommandHandlers(prev => ({ ...prev, [command]: handler }));
  }, []);

  // Render page content
  const renderPageContent = () => {
    // Render actual ProfilePage when on Career DNA tab
    if (activeTab === ActiveTab.PROFILE) {
      return (
        <ProfilePage 
          profile={profile}
          updateProfile={updateProfile}
          onSaveProfile={saveProfile}
          addAgentMessage={addAgentMessage}
        />
      );
    }

    // Render JobSearchPage when on Opportunity Funnel tab
    if (activeTab === ActiveTab.JOBS) {
      return (
        <JobSearchPage 
          profile={profile}
          agentMode={agentMode}
          addAgentMessage={addAgentMessage}
          onExecuteCommand={registerCommandHandler}
        />
      );
    }

    // Render ApplicationsPage when on Application Pipeline tab
    if (activeTab === ActiveTab.APPLICATIONS) {
      return (
        <ApplicationsPage 
          profile={profile}
          agentMode={agentMode}
          addAgentMessage={addAgentMessage}
          onExecuteCommand={registerCommandHandler}
          applications={applications}
          submitApplication={submitApplication}
          updateApplicationStatus={updateApplicationStatus}
        />
      );
    }

    // Render InterviewPage when on Interviews tab
    if (activeTab === ActiveTab.INTERVIEWS) {
      return (
        <InterviewPage 
          profile={profile}
          agentMode={agentMode}
          addAgentMessage={addAgentMessage}
          onExecuteCommand={registerCommandHandler}
          applications={applications}
        />
      );
    }

    // Render AnalyticsPage when on Reports tab
    if (activeTab === ActiveTab.REPORTS) {
      return (
        <AnalyticsPage 
          applications={applications}
          jobs={jobs}
          profile={profile}
          agentMode={agentMode}
          onUpdateAnalytics={(data) => console.log('Analytics updated:', data)}
        />
      );
    }

    // Placeholder content for other tabs
    const pageInfo = {
      [ActiveTab.DASHBOARD]: {
        title: 'Command Center',
        description: 'Your AI agent\'s mission control center with real-time insights and autonomous operations overview.',
        features: [
          'Real-time Agent Status',
          'Performance Analytics Dashboard',
          'Autonomous Operations Log',
          'Strategic Insights & Recommendations'
        ]
      },
      [ActiveTab.APPLICATIONS]: {
        title: 'Application Pipeline',
        description: 'Track and manage your job applications with intelligent status monitoring and follow-up automation.',
        features: [
          'Application Status Tracking',
          'Automated Follow-up System',
          'Interview Scheduling Assistant',
          'Response Rate Analytics'
        ]
      },
      [ActiveTab.ANALYTICS]: {
        title: 'Intelligence Core',
        description: 'Performance analytics with A/B testing and continuous optimization of your job search strategy.',
        features: [
          'Success Rate Analytics',
          'A/B Testing Results',
          'Market Trend Analysis',
          'Strategy Optimization Recommendations'
        ]
      }
    };

    const currentPage = pageInfo[activeTab];
    if (!currentPage) return null;

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h1 className="heading-xl gradient-text mb-4">
              {currentPage.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {currentPage.description}
            </p>
          </div>

          <div className="glass p-8 rounded-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-primary/20 rounded-full">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-4">Advanced Features Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              Advanced AI-powered functionality being implemented...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPage.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-left">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" message="Initializing AI Career Agent..." aiMode />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        agentMode={agentMode}
        setAgentMode={setAgentMode}
        profile={profile}
      />
      
      <Navigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        agentMode={agentMode}
      />
      
      <main className="pt-32">
        {renderPageContent()}
      </main>

      <AIAssistant
        profile={profile}
        activeTab={activeTab}
        agentMode={agentMode}
        applications={applications}
        jobs={jobs}
        analytics={analytics}
        onExecuteCommand={handleCommandExecution}
        onNavigateToTab={setActiveTab}
        onUpdateProfile={updateProfile}
        onSearchJobs={(params) => addAgentMessage(`🔍 Searching for jobs with criteria: ${JSON.stringify(params)}`)}
        onSubmitApplication={(params) => addAgentMessage(`📝 Submitting application: ${JSON.stringify(params)}`)}
        onStartInterview={(params) => addAgentMessage(`🎯 Starting interview preparation: ${JSON.stringify(params)}`)}
        onRunExperiment={(params) => addAgentMessage(`🧪 Running experiment: ${JSON.stringify(params)}`)}
      />
    </div>
  );
}

export default App;

