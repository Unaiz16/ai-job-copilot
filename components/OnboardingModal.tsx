import React, { useState, useCallback } from 'react';
import { Icon } from './common/Icon';
import Spinner from './common/Spinner';
import type { UserProfile, CareerArtifact } from '../types';
import { extractProfileFromCV, generateClarifyingQuestions } from '../services/geminiService';

interface OnboardingModalProps {
    profile: UserProfile;
    onComplete: (finalProfile: UserProfile, searchMode: 'review' | 'autonomous') => void;
    addAgentMessage: (message: string) => void;
    onSkip: () => void;
}

type LoadingState = 'analyzing' | 'none';
type UploadedFile = { name: string; mimeType: string; data: string; };

const OnboardingModal: React.FC<OnboardingModalProps> = ({ profile, onComplete, addAgentMessage, onSkip }) => {
    const [step, setStep] = useState(1);
    const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
    const [loading, setLoading] = useState<LoadingState>('none');
    const [pastedCV, setPastedCV] = useState('');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

    const handleProfileChange = (field: keyof UserProfile, value: any) => {
        setLocalProfile(prev => ({ ...prev, [field]: value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = (event.target?.result as string).split(',')[1];
                setUploadedFile({ name: file.name, mimeType: file.type, data: base64String });
                handleProfileChange('baseCVfilename', file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeCV = useCallback(async () => {
        const hasPastedText = pastedCV.trim().length > 0;
        const hasUploadedFile = !!uploadedFile;

        if (!hasPastedText && !hasUploadedFile) {
            alert("Please upload your CV file or paste its content first.");
            return;
        }

        setLoading('analyzing');
        const cvData = hasPastedText ? { text: pastedCV } : { file: uploadedFile! };
        const extractedData = await extractProfileFromCV(cvData, localProfile.linkedinUrl);
        
        if (extractedData) {
            setLocalProfile(prev => ({
                ...prev,
                name: extractedData.name || prev.name,
                summary: extractedData.summary || prev.summary,
                keySkills: extractedData.keySkills || prev.keySkills,
                jobRoles: extractedData.jobRoles || prev.jobRoles,
                locations: extractedData.locations || prev.locations,
                yearsOfExperience: extractedData.yearsOfExperience || prev.yearsOfExperience,
                education: extractedData.education || prev.education,
                languages: extractedData.languages || prev.languages,
                certifications: extractedData.certifications || prev.certifications,
                baseCV: extractedData.extractedText || (hasPastedText ? pastedCV : ''),
            }));
             if (hasPastedText) handleProfileChange('baseCVfilename', 'pasted_cv.txt');
            
            const clarifyingQuestion = await generateClarifyingQuestions(extractedData);
            if (clarifyingQuestion) addAgentMessage(clarifyingQuestion);
            
            setStep(2); // Move to next step on success
        } else {
            alert("The AI couldn't analyze the CV. Please check the format or try pasting the text directly.");
        }
        setLoading('none');
    }, [pastedCV, uploadedFile, localProfile.linkedinUrl, addAgentMessage]);

    const handleSetStrategy = (autonomous: boolean) => {
        const finalProfile = { ...localProfile, autonomousMode: autonomous };
        setLocalProfile(finalProfile);
        setStep(3);
    };
    
    const handleStartFirstMission = () => {
        const searchMode = localProfile.autonomousMode ? 'autonomous' : 'review';
        onComplete(localProfile, searchMode);
    };


    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome! Let's build your Career DNA.</h2>
                        <p className="text-slate-400 mb-6">Give the agent your CV and LinkedIn profile. It will analyze them to build a powerful foundation for your job search.</p>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="onboarding-linkedin" className="block text-sm font-medium text-slate-300 mb-1">LinkedIn Profile URL (Optional)</label>
                                <input type="url" id="onboarding-linkedin" value={localProfile.linkedinUrl || ''} onChange={(e) => handleProfileChange('linkedinUrl', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://linkedin.com/in/your-profile"/>
                            </div>
                            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <Icon icon="documentText" className="mx-auto h-12 w-12 text-slate-500" />
                                    <div className="flex text-sm text-slate-400">
                                        <label htmlFor="onboarding-file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 px-1">
                                            <span>Upload a file</span>
                                            <input id="onboarding-file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf,.doc,.docx" />
                                        </label>
                                    </div>
                                    {uploadedFile ? <p className="text-xs text-green-400 font-semibold">{uploadedFile.name}</p> : <p className="text-xs text-slate-500">PDF, DOCX, TXT</p>}
                                </div>
                            </div>
                        </div>
                         <div className="mt-6 flex justify-end">
                            <button onClick={handleAnalyzeCV} disabled={!uploadedFile || loading === 'analyzing'} className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400/50">
                                {loading === 'analyzing' ? <Spinner size="sm" /> : <Icon icon="sparkles" className="mr-2 h-5 w-5" />}
                                Analyze & Continue
                            </button>
                        </div>
                    </>
                );
            case 2:
                return (
                     <>
                        <h2 className="text-2xl font-bold text-white mb-2">Set Your Initial Strategy</h2>
                        <p className="text-slate-400 mb-6">How do you want your agent to work for you? You can change this at any time in your profile.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={() => handleSetStrategy(false)} className="flex flex-col items-center p-6 text-center bg-slate-900 rounded-lg border-2 border-slate-700 hover:border-sky-500 transition-all">
                                <Icon icon="eye" className="h-12 w-12 text-sky-400 mb-3" />
                                <h3 className="font-bold text-lg text-white">Review First Mode</h3>
                                <p className="text-sm text-slate-400 mt-1">Agent finds jobs. You review and command it to apply.</p>
                            </button>
                            <button onClick={() => handleSetStrategy(true)} className="flex flex-col items-center p-6 text-center bg-slate-900 rounded-lg border-2 border-slate-700 hover:border-purple-500 transition-all">
                                 <Icon icon="sparkles" className="h-12 w-12 text-purple-400 mb-3" />
                                <h3 className="font-bold text-lg text-white">Autonomous Mode</h3>
                                <p className="text-sm text-slate-400 mt-1">Agent finds and automatically applies to high-match jobs.</p>
                            </button>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-2">Ready for Your First Mission!</h2>
                        <p className="text-slate-400 mb-6">Your profile is built and your strategy is set. The agent will now run its first search in "Review First" mode so you can see it in action.</p>
                        <div className="mt-6 flex justify-center">
                            <button onClick={handleStartFirstMission} className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                Let's Go!
                                <Icon icon="search" className="ml-2 h-5 w-5" />
                            </button>
                        </div>
                    </>
                );
            default: return null;
        }
    };


    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700">
                 <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                           <Icon icon="briefcase" className="h-6 w-6 text-sky-400" />
                           <h1 className="text-xl font-bold text-slate-200">Agent Onboarding</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={`h-2 w-8 rounded-full ${step >= s ? 'bg-indigo-500' : 'bg-slate-600'}`}></div>
                                ))}
                            </div>
                            <button onClick={onSkip} className="text-sm text-slate-400 hover:text-white">
                                Skip for now
                            </button>
                        </div>
                    </div>
                    {renderStepContent()}
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;