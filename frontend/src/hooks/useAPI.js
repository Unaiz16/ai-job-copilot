// React hook for API integration with error handling and loading states
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService.js';

export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Check backend connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const health = await apiService.healthCheck();
      setConnectionStatus(health.status);
    } catch (err) {
      setConnectionStatus('disconnected');
    }
  };

  const executeRequest = useCallback(async (requestFn, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    connectionStatus,
    checkConnection,
    executeRequest,
    
    // Profile methods
    getProfile: () => executeRequest(apiService.getProfile),
    updateProfile: (data) => executeRequest(apiService.updateProfile, data),
    uploadCV: (file) => executeRequest(apiService.uploadCV, file),
    analyzeCV: (data) => executeRequest(apiService.analyzeCV, data),
    
    // Job search methods
    searchJobs: (params) => executeRequest(apiService.searchJobs, params),
    getJobDetails: (id) => executeRequest(apiService.getJobDetails, id),
    calculateFitScore: (jobId, profileId) => executeRequest(apiService.calculateFitScore, jobId, profileId),
    
    // Application methods
    getApplications: () => executeRequest(apiService.getApplications),
    submitApplication: (data) => executeRequest(apiService.submitApplication, data),
    updateApplicationStatus: (id, status) => executeRequest(apiService.updateApplicationStatus, id, status),
    generateCoverLetter: (jobId, profileId) => executeRequest(apiService.generateCoverLetter, jobId, profileId),
    
    // Analytics methods
    getAnalytics: (range) => executeRequest(apiService.getAnalytics, range),
    getExperiments: () => executeRequest(apiService.getExperiments),
    createExperiment: (data) => executeRequest(apiService.createExperiment, data),
    updateExperiment: (id, data) => executeRequest(apiService.updateExperiment, id, data),
    
    // AI Assistant methods
    sendMessage: (message, context) => executeRequest(apiService.sendMessage, message, context),
    executeCommand: (command, params) => executeRequest(apiService.executeCommand, command, params),
    
    // Automation methods
    automateApplication: (jobId, data) => executeRequest(apiService.automateApplication, jobId, data),
    getAutomationStatus: (taskId) => executeRequest(apiService.getAutomationStatus, taskId),
    testAutomation: (url, selectors) => executeRequest(apiService.testAutomation, url, selectors)
  };
};

// Hook for profile data
export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useAPI();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await api.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedProfile = await api.updateProfile(updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile: loadProfile
  };
};

// Hook for applications data
export const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useAPI();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await api.getApplications();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitApplication = async (applicationData) => {
    try {
      const newApplication = await api.submitApplication(applicationData);
      setApplications(prev => [...prev, newApplication]);
      return newApplication;
    } catch (error) {
      console.error('Failed to submit application:', error);
      throw error;
    }
  };

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await api.updateApplicationStatus(applicationId, status);
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status }
            : app
        )
      );
    } catch (error) {
      console.error('Failed to update application status:', error);
      throw error;
    }
  };

  return {
    applications,
    loading,
    submitApplication,
    updateApplicationStatus,
    refreshApplications: loadApplications
  };
};

// Hook for analytics data
export const useAnalytics = (timeRange = '30d') => {
  const [analytics, setAnalytics] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useAPI();

  useEffect(() => {
    loadAnalytics();
    loadExperiments();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadExperiments = async () => {
    try {
      const data = await api.getExperiments();
      setExperiments(data.experiments || []);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async (experimentData) => {
    try {
      const newExperiment = await api.createExperiment(experimentData);
      setExperiments(prev => [...prev, newExperiment]);
      return newExperiment;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  };

  return {
    analytics,
    experiments,
    loading,
    createExperiment,
    refreshAnalytics: loadAnalytics,
    refreshExperiments: loadExperiments
  };
};

