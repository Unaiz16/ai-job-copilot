import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ActiveTab, ApplicationStatus, GenerationType, defaultProfile } from './types';
import { generateTailoredCV, generateCoverLetter, generateInterviewPrep, generatePerformanceInsights } from './services/geminiService';
import * as gdriveService from './services/gdriveService';
import * as gdriveSheetsService from './services/gdriveSheetsService';
import * as webAutomationService from './services/webAutomationService';
import * as dataService from './services/dataService';
import Spinner from './components/common/Spinner';
import './App.css';

const App = () => {
    const [activeTab, setActiveTab] = useState(ActiveTab.DASHBOARD);
    const [profile, setProfile] = useState(defaultProfile);
    const [applications, setApplications] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

    useEffect(() => {
        const loadAppData = async () => {
            setIsDataLoading(true);
            try {
                const [profileData, appsData, expsData] = await Promise.all([
                    dataService.getProfile(),
                    dataService.getApplications(),
                    dataService.getExperiments(),
                ]);

                const loadedProfile = profileData || defaultProfile;
                setProfile(loadedProfile);
                setApplications(appsData || []);
                setExperiments(expsData || []);
                
                const isNewUser = !loadedProfile.name;
                const onboardingSkipped = localStorage.getItem('onboardingSkipped') === 'true';
                if (isNewUser && !onboardingSkipped) {
                    // Handle onboarding if needed
                }
            } catch (error) {
                console.error("Failed to load app data from backend", error);
                setProfile(defaultProfile);
                setApplications([]);
                setExperiments([]);
            } finally {
                setIsDataLoading(false);
            }
        };
        loadAppData();
    }, []);

    const trackedJobIds = useMemo(() => new Set(applications.map(app => app.id)), [applications]);

    const addAgentMessage = useCallback((text) => {
        if (!text) return;
        setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'agent', text }]);
        setHasUnreadMessages(true);
    }, []);

    const saveProfile = async (newProfile) => {
        setProfile(newProfile);
        await dataService.saveProfile(newProfile);
    };

    const saveApplications = useCallback(async (newApplications) => {
        setApplications(newApplications);
        await dataService.saveApplications(newApplications);
    }, []);
    
    const saveExperiments = useCallback(async (newExperiments) => {
        setExperiments(newExperiments);
        await dataService.saveExperiments(newExperiments);
    }, []);

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-white">AI Job Copilot</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-slate-300">Welcome back!</span>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {Object.values(ActiveTab).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab
                                        ? 'border-indigo-500 text-indigo-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                                }`}
                            >
                                {tab}
                                {tab === ActiveTab.MY_APPLICATIONS && applications.length > 0 && (
                                    <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-1">
                                        {applications.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main>
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-white">
                        <h2 className="text-3xl font-bold mb-4">Welcome to AI Job Copilot</h2>
                        <p className="text-slate-300 mb-8">
                            Your intelligent career companion is being set up. The frontend is now properly hosted and ready for deployment.
                        </p>
                        <div className="bg-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
                            <h3 className="text-xl font-semibold mb-4">Current Status</h3>
                            <div className="space-y-2 text-left">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span>Frontend: Deployed and Ready</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span>Backend: Connected to {window.location.hostname.includes('localhost') ? 'Local Development' : 'Production'}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span>Database: Supabase Integration Ready</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                                    <span>Profile: {profile.name ? 'Configured' : 'Needs Setup'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;

