import React, { useState } from 'react';
import type { UserProfile, CareerArtifact, ExtractedProfile } from '../../types';
import { extractProfileFromCV, generateSuggestedJobRoles, generateClarifyingQuestions } from '../../src/services/geminiService';
import { Icon } from '../common/Icon';
import Spinner from '../common/Spinner';

interface ProfilePageProps {
    profile: UserProfile;
    onSave: (profile: UserProfile) => Promise<void>;
    onAgentMessage: (message: string) => void;
    onLinkGoogleDrive: () => void;
    onViewSheet: () => void;
}

type LoadingState = 'analyzing' | 'suggestingRoles' | 'none';
type CVInputMethod = 'upload' | 'paste';

interface UploadedFile {
    name: string;
    mimeType: string;
    data: string; // base64
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onSave, onAgentMessage, onLinkGoogleDrive, onViewSheet }) => {
    const [localProfile, setLocalProfile] = useState<UserProfile>({ ...profile, artifacts: profile.artifacts || [] });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [loading, setLoading] = useState<LoadingState>('none');
    const [cvInputMethod, setCvInputMethod] = useState<CVInputMethod>('upload');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [pastedCV, setPastedCV] = useState('');
    const [isFitScoreOverrideEnabled, setIsFitScoreOverrideEnabled] = useState(typeof profile.minimumFitScore === 'number');

    const handleProfileChange = (field: keyof UserProfile, value: any) => {
        setLocalProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleArtifactChange = (id: string, field: 'label' | 'content', value: string) => {
        const updatedArtifacts = (localProfile.artifacts || []).map(artifact => 
            artifact.id === id ? { ...artifact, [field]: value } : artifact
        );
        handleProfileChange('artifacts', updatedArtifacts);
    };

    const handleAddArtifact = () => {
        const newArtifact: CareerArtifact = { id: crypto.randomUUID(), label: '', content: '' };
        handleProfileChange('artifacts', [...(localProfile.artifacts || []), newArtifact]);
    };
    
    const handleRemoveArtifact = (id: string) => {
        const updatedArtifacts = (localProfile.artifacts || []).filter(artifact => artifact.id !== id);
        handleProfileChange('artifacts', updatedArtifacts);
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
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(localProfile);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };
    
     const handleUnlinkGdrive = async () => {
        const { gdriveLinked, gSheetId, gSheetUrl, ...rest } = localProfile;
        const updatedProfile = { ...rest, gdriveLinked: false };
        setLocalProfile(updatedProfile);
        await onSave(updatedProfile);
    };


    const handleAnalyzeCV = async () => {
        const hasPastedText = cvInputMethod === 'paste' && pastedCV.trim();
        const hasUploadedFile = cvInputMethod === 'upload' && uploadedFile;

        if (!hasPastedText && !hasUploadedFile) {
            alert("Please upload your CV file or paste its content first.");
            return;
        }

        setLoading('analyzing');
        const cvData = hasPastedText ? { text: pastedCV } : { file: uploadedFile! };

        const extractedData = await extractProfileFromCV(cvData, localProfile.linkedinUrl, localProfile.artifacts);
        
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
             if (hasPastedText) {
                handleProfileChange('baseCVfilename', 'pasted_cv.txt');
            }
            // Proactively ask clarifying questions
            const clarifyingQuestion = await generateClarifyingQuestions(extractedData);
            if (clarifyingQuestion) {
                onAgentMessage(clarifyingQuestion);
            }
        } else {
            alert("The AI couldn't analyze the CV. Please check the format or try pasting the text directly.");
        }

        setLoading('none');
    };
    
    const handleSuggestRoles = async () => {
        setLoading('suggestingRoles');
        const suggestedRoles = await generateSuggestedJobRoles(localProfile);
        if (suggestedRoles) {
            handleProfileChange('jobRoles', suggestedRoles.join(', '));
        } else {
            alert("The AI couldn't suggest new roles at this time. Please ensure your profile summary and skills are filled out.");
        }
        setLoading('none');
    };

    const handleToggleFitScoreOverride = (enabled: boolean) => {
        setIsFitScoreOverrideEnabled(enabled);
        if (enabled) {
            // Set a default if no value exists, or keep existing value
            if (typeof localProfile.minimumFitScore !== 'number') {
                handleProfileChange('minimumFitScore', 75);
            }
        } else {
            // Clear the value when disabled
            const { minimumFitScore, ...rest } = localProfile;
            setLocalProfile(rest);
        }
    };

    const isAnalyzeDisabled = loading !== 'none' || (cvInputMethod === 'upload' && !uploadedFile) || (cvInputMethod === 'paste' && !pastedCV.trim());

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-1">Your Career DNA</h2>
                <p className="text-slate-400 mb-6">This is the agent's brain. Provide your CV, LinkedIn, and any other "artifacts" (like past job descriptions or project notes), then let the AI synthesize them into a powerful, unified profile.</p>
                
                 {/* CV Input Section */}
                <div className="space-y-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div>
                        <div className="flex border-b border-slate-600">
                            <button onClick={() => setCvInputMethod('upload')} className={`px-4 py-2 text-sm font-medium ${cvInputMethod === 'upload' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>Upload CV File</button>
                            <button onClick={() => setCvInputMethod('paste')} className={`px-4 py-2 text-sm font-medium ${cvInputMethod === 'paste' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>Paste CV Text</button>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                    {cvInputMethod === 'upload' ? (
                        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Icon icon="documentText" className="mx-auto h-12 w-12 text-slate-500" />
                                <div className="flex text-sm text-slate-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 focus-within:ring-indigo-500 px-1">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf,.doc,.docx" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                {localProfile.baseCVfilename ? (
                                    <p className="text-xs text-green-400 font-semibold">{localProfile.baseCVfilename}</p>
                                ) : (
                                    <p className="text-xs text-slate-500">PDF, DOCX, TXT</p>
                                )}
                            </div>
                        </div>
                    ) : (
                         <textarea 
                            value={pastedCV} 
                            onChange={(e) => setPastedCV(e.target.value)}
                            rows={10} 
                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Paste the full text of your CV here..."
                        />
                    )}
                    </div>
                </div>

                {/* Career Artifacts Section */}
                <div className="space-y-4 mt-6 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <h3 className="text-lg font-bold text-slate-200">Career Artifacts (Optional)</h3>
                    <p className="text-sm text-slate-400">Add more context for the AI, like old job descriptions, project case studies, or performance reviews.</p>
                    <div className="space-y-4">
                        {(localProfile.artifacts || []).map((artifact, index) => (
                            <div key={artifact.id} className="p-3 bg-slate-800/70 rounded-md border border-slate-600 space-y-2">
                                <div className="flex justify-between items-center">
                                    <input
                                        type="text"
                                        placeholder={`Artifact #${index + 1} Label (e.g., Last Job Description)`}
                                        value={artifact.label}
                                        onChange={(e) => handleArtifactChange(artifact.id, 'label', e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-1 text-sm text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                     <button type="button" onClick={() => handleRemoveArtifact(artifact.id)} className="ml-2 text-slate-500 hover:text-red-400 p-1">
                                        <Icon icon="trash" className="h-5 w-5" />
                                    </button>
                                </div>
                                <textarea
                                    placeholder="Paste content here..."
                                    rows={5}
                                    value={artifact.content}
                                    onChange={(e) => handleArtifactChange(artifact.id, 'content', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddArtifact}
                        className="inline-flex items-center px-4 py-2 border border-dashed border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                    >
                        <Icon icon="plus-circle" className="mr-2 h-5 w-5" />
                        Add Another Artifact
                    </button>
                </div>
                
                <div className="flex justify-center pt-8">
                    <button 
                        type="button" 
                        onClick={handleAnalyzeCV} 
                        disabled={isAnalyzeDisabled}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-sky-500/50 disabled:cursor-not-allowed"
                    >
                            {loading === 'analyzing' ? <Spinner size="sm" /> : <Icon icon="sparkles" className="mr-2 h-5 w-5" />}
                        {loading === 'analyzing' ? 'Analyzing...' : 'Analyze & Build Profile with AI'}
                    </button>
                </div>


                <form onSubmit={handleSubmit} className="space-y-6 pt-8 border-t border-slate-700 mt-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                            <input type="text" id="name" value={localProfile.name || ''} onChange={(e) => handleProfileChange('name', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Jane Doe"/>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Application Email</label>
                            <input type="email" id="email" value={localProfile.email || ''} onChange={(e) => handleProfileChange('email', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., jane.doe@email.com"/>
                            <p className="text-xs text-slate-500 mt-1">Agent will use this for "Easy Apply".</p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="linkedin" className="block text-sm font-medium text-slate-300 mb-1">LinkedIn Profile URL</label>
                        <input type="url" id="linkedin" value={localProfile.linkedinUrl || ''} onChange={(e) => handleProfileChange('linkedinUrl', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://linkedin.com/in/your-profile"/>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="jobRoles" className="block text-sm font-medium text-slate-300 mb-1">Desired Job Roles</label>
                            <div className="flex gap-2">
                                <input type="text" id="jobRoles" value={localProfile.jobRoles || ''} onChange={(e) => handleProfileChange('jobRoles', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Software Engineer, Product Manager"/>
                                <button type="button" onClick={handleSuggestRoles} disabled={loading !== 'none'} title="Suggest Roles with AI" className="px-3 py-2 bg-sky-600 hover:bg-sky-700 rounded-md text-white disabled:bg-sky-500/50">
                                    {loading === 'suggestingRoles' ? <Spinner size="sm" /> : <Icon icon="sparkles" className="h-5 w-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Comma-separated list.</p>
                        </div>
                        <div>
                            <label htmlFor="locations" className="block text-sm font-medium text-slate-300 mb-1">Target Locations</label>
                            <input type="text" id="locations" value={localProfile.locations || ''} onChange={(e) => handleProfileChange('locations', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Berlin, Munich (Germany)"/>
                            <p className="text-xs text-slate-500 mt-1">Comma-separated list (Germany focus).</p>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-slate-300 mb-1">Years of Professional Experience</label>
                        <input type="text" id="yearsOfExperience" value={localProfile.yearsOfExperience || ''} onChange={(e) => handleProfileChange('yearsOfExperience', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 5 years"/>
                    </div>

                    <div>
                        <label htmlFor="education" className="block text-sm font-medium text-slate-300 mb-1">Education</label>
                        <textarea id="education" rows={3} value={localProfile.education || ''} onChange={(e) => handleProfileChange('education', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="AI will extract this from your CV."/>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="languages" className="block text-sm font-medium text-slate-300 mb-1">Languages</label>
                            <input type="text" id="languages" value={localProfile.languages || ''} onChange={(e) => handleProfileChange('languages', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., German (C1), English (Fluent)"/>
                        </div>
                        <div>
                            <label htmlFor="certifications" className="block text-sm font-medium text-slate-300 mb-1">Certifications & Licenses</label>
                            <input type="text" id="certifications" value={localProfile.certifications || ''} onChange={(e) => handleProfileChange('certifications', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., PMP, AWS Certified Developer"/>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-slate-300 mb-1">Professional Summary</label>
                        <textarea id="summary" rows={4} value={localProfile.summary || ''} onChange={(e) => handleProfileChange('summary', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Generated by AI after analyzing your CV."/>
                    </div>

                    <div>
                        <label htmlFor="keySkills" className="block text-sm font-medium text-slate-300 mb-1">Key Skills</label>
                        <input type="text" id="keySkills" value={localProfile.keySkills || ''} onChange={(e) => handleProfileChange('keySkills', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Generated by AI after analyzing your CV."/>
                        <p className="text-xs text-slate-500 mt-1">Comma-separated list of your most important skills.</p>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                        <h3 className="text-lg font-bold text-purple-400">Agent Settings</h3>
                         <div className="mt-4 p-4 bg-purple-900/30 border border-purple-700 rounded-lg space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className={`relative inline-block w-11 mr-2 align-middle select-none transition duration-200 ease-in`}>
                                        <input type="checkbox" checked={localProfile.autonomousMode} onChange={() => handleProfileChange('autonomousMode', !localProfile.autonomousMode)} id="autonomous-toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                        <label htmlFor="autonomous-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-600 cursor-pointer"></label>
                                    </div>
                                    <style>{`.toggle-checkbox:checked { right: 0; border-color: #a855f7; } .toggle-checkbox:checked + .toggle-label { background-color: #a855f7; }`}</style>
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="autonomous-toggle" className="font-medium text-slate-200 cursor-pointer">Autonomous Application Mode</label>
                                    <p className="text-slate-400 text-xs mt-1">Authorize the agent to apply for high-match jobs (fit score > 90%) on your behalf.</p>
                                </div>
                            </div>
                             <div className="pt-4 border-t border-purple-800/50">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                       <input
                                            type="checkbox"
                                            id="fit-score-override"
                                            checked={isFitScoreOverrideEnabled}
                                            onChange={(e) => handleToggleFitScoreOverride(e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700 mt-0.5"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="fit-score-override" className="font-medium text-slate-200 cursor-pointer">Set Minimum Fit Score</label>
                                        <p className="text-slate-400 text-xs mt-1">By default, the agent uses its own judgment. Check this to enforce a strict minimum fit score for job searches.</p>
                                    </div>
                                </div>
                                {isFitScoreOverrideEnabled && (
                                     <div className="mt-3 flex items-center gap-4 pl-7">
                                         <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={localProfile.minimumFitScore || 0}
                                            onChange={(e) => handleProfileChange('minimumFitScore', parseInt(e.target.value, 10))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="relative">
                                             <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={localProfile.minimumFitScore || 0}
                                                onChange={(e) => handleProfileChange('minimumFitScore', parseInt(e.target.value, 10))}
                                                className="w-20 bg-slate-900 border border-slate-600 rounded-md px-2 py-1 text-white text-center"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                        </div>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                        <h3 className="text-lg font-bold text-teal-400">Integrations</h3>
                         <div className="mt-4 p-4 bg-slate-900/30 border border-slate-700 rounded-lg">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center">
                                    <Icon icon="google-drive" className="h-10 w-10 mr-4 flex-shrink-0"/>
                                    <div>
                                        <p className="font-medium text-slate-200">Google Drive & Sheets Sync</p>
                                        <p className="text-slate-400 text-xs mt-1">Save docs to Drive & sync applications with a Google Sheet.</p>
                                        {profile.gdriveLinked && profile.gSheetUrl && (
                                            <button type="button" onClick={onViewSheet} className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center mt-1">
                                                View Application Sheet <Icon icon="link" className="h-3 w-3 ml-1" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {profile.gdriveLinked ? (
                                    <div className="flex items-center gap-2">
                                         <div className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-green-400 bg-green-900/50">
                                             <Icon icon="check-circle" className="h-5 w-5 mr-2" />
                                             Linked
                                         </div>
                                         <button type="button" onClick={handleUnlinkGdrive} className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:bg-slate-700 border border-slate-600">
                                            Unlink
                                         </button>
                                     </div>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={onLinkGoogleDrive}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Link Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                        <h3 className="text-lg font-bold text-red-400 flex items-center">
                            <Icon icon="lock-closed" className="h-5 w-5 mr-2 flex-shrink-0" />
                            Agent Credentials Vault
                        </h3>
                         <p className="text-slate-400 text-xs mt-2">
                            Provide dedicated credentials for the agent to sign up and apply on job portals that don't support "Easy Apply". This information is stored securely and is only used for application purposes.
                         </p>
                         <div className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg space-y-4">
                            <div>
                                <label htmlFor="agent-email" className="block text-sm font-medium text-slate-300 mb-1">Agent's Job-Seeking Email</label>
                                <input type="email" id="agent-email" value={localProfile.agentEmail || ''} onChange={e => handleProfileChange('agentEmail', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-red-500 focus:border-red-500" placeholder="e.g., jane.doe.jobs@email.com"/>
                            </div>
                             <div>
                                <label htmlFor="agent-password" className="block text-sm font-medium text-slate-300 mb-1">Agent's Password</label>
                                <div className="relative">
                                    <input 
                                        type={passwordVisible ? 'text' : 'password'}
                                        id="agent-password" 
                                        value={localProfile.agentPassword || ''} 
                                        onChange={e => handleProfileChange('agentPassword', e.target.value)} 
                                        className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-red-500 focus:border-red-500 pr-10" 
                                        placeholder="Enter password for the agent's email"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setPasswordVisible(!passwordVisible)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white"
                                        aria-label={passwordVisible ? "Hide password" : "Show password"}
                                    >
                                        <Icon icon={passwordVisible ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                         </div>
                    </div>

                    
                    <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-700">
                        {saveSuccess && <p className="text-green-400 text-sm">Profile saved successfully!</p>}
                        <button type="submit" className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500">
                            Save Profile & Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
