import React, { useState, useEffect } from 'react';
import { ActiveTab, ApplicationStatus } from './types';
import * as dataService from './services/dataService';
import Spinner from './components/common/Spinner';

const defaultProfile = {
    name: '', summary: '', baseCV: '', baseCVfilename: '', jobRoles: '', locations: '',
    keySkills: '', yearsOfExperience: '', autonomousMode: false, linkedinUrl: '', gdriveLinked: false,
    email: '', agentEmail: '', agentPassword: '', artifacts: [],
    education: '', languages: '', certifications: '',
    gSheetId: '', gSheetUrl: ''
};

const App = () => {
    const [activeTab, setActiveTab] = useState(ActiveTab.DASHBOARD);
    const [profile, setProfile] = useState(defaultProfile);
    const [applications, setApplications] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAppData = async () => {
            setIsLoading(true);
            try {
                const [profileData, appsData, expsData] = await Promise.all([
                    dataService.getProfile(),
                    dataService.getApplications(),
                    dataService.getExperiments(),
                ]);

                setProfile(profileData || defaultProfile);
                setApplications(appsData || []);
                setExperiments(expsData || []);
            } catch (error) {
                console.error("Failed to load app data from backend", error);
                setProfile(defaultProfile);
                setApplications([]);
                setExperiments([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadAppData();
    }, []);

    const saveProfile = async (newProfile) => {
        setProfile(newProfile);
        await dataService.saveProfile(newProfile);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Spinner size="lg" />
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case ActiveTab.PROFILE:
                return (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="bg-slate-800 rounded-lg p-6">
                            <h2 className="text-2xl font-bold text-white mb-6">My Profile</h2>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.name || ''}
                                            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email || ''}
                                            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Professional Summary
                                    </label>
                                    <textarea
                                        value={profile.summary || ''}
                                        onChange={(e) => setProfile(prev => ({ ...prev, summary: e.target.value }))}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Brief summary of your professional background and career objectives..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Key Skills
                                        </label>
                                        <textarea
                                            value={profile.keySkills || ''}
                                            onChange={(e) => setProfile(prev => ({ ...prev, keySkills: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="List your key skills, separated by commas..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Years of Experience
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.yearsOfExperience || ''}
                                            onChange={(e) => setProfile(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g., 5 years"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-700">
                                    <button
                                        onClick={() => saveProfile(profile)}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        Save Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-center py-12">
                        <h3 className="text-2xl font-bold text-white mb-4">
                            {activeTab === ActiveTab.DASHBOARD && "Dashboard"}
                            {activeTab === ActiveTab.FIND_JOBS && "Find Jobs"}
                            {activeTab === ActiveTab.MY_APPLICATIONS && "My Applications"}
                            {activeTab === ActiveTab.REPORTS && "Reports"}
                            {activeTab === ActiveTab.DOC_GENERATOR && "Doc Generator"}
                        </h3>
                        <p className="text-slate-400">
                            This feature is being implemented. The profile tab is fully functional.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <h1 className="text-3xl font-bold text-white">AI Job Copilot</h1>
                        <div className="text-slate-300">Welcome back!</div>
                    </div>
                </div>
            </header>

            <nav className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {[
                            { id: ActiveTab.DASHBOARD, label: 'Dashboard' },
                            { id: ActiveTab.FIND_JOBS, label: 'Find Jobs' },
                            { id: ActiveTab.MY_APPLICATIONS, label: 'My Applications' },
                            { id: ActiveTab.REPORTS, label: 'Reports' },
                            { id: ActiveTab.PROFILE, label: 'My Profile' },
                            { id: ActiveTab.DOC_GENERATOR, label: 'Doc Generator' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <main>
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default App;

