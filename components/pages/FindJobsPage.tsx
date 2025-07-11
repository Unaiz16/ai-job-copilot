import React, { useState, useCallback, useEffect } from 'react';
import type { Job, UserProfile } from '../../types';
import { GenerationType } from '../../types';
import { generateJobs } from '../../services/geminiService';
import JobCard from '../JobCard';
import Spinner from '../common/Spinner';
import { Icon } from '../common/Icon';
import SearchModeModal from '../SearchModeModal';

interface FindJobsPageProps {
    onTrackJob: (job: Job) => void;
    onAutoApply: (job: Job) => Promise<{ success: boolean; log: string[] }>;
    trackedJobIds: Set<string>;
    profile: UserProfile;
    onSwitchTab: (tab: 'My Profile') => void;
    onAgentMessage: (message: string) => void;
    onGenerate: (job: Job, type: GenerationType) => Promise<void>;
    onBatchTrackJobs: (jobs: Job[]) => void;
    commandedSearch: { mode: SearchMode } | null;
    onCommandedSearchHandled: () => void;
}

type SearchMode = 'autonomous' | 'review';
type ApplyStatus = 'applying' | 'success' | 'error';
type ProcessingStatus = 'tracking' | 'generating-cv' | 'generating-cl' | 'applying';


const AUTONOMOUS_APPLY_THRESHOLD = 90; // Fit score threshold

const FindJobsPage: React.FC<FindJobsPageProps> = ({ 
    onTrackJob, onAutoApply, trackedJobIds, profile, onSwitchTab, 
    onAgentMessage, onGenerate, onBatchTrackJobs,
    commandedSearch, onCommandedSearchHandled
}) => {
    const [foundJobs, setFoundJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agentMessage, setAgentMessage] = useState<string | null>(null);
    const [isModeModalOpen, setIsModeModalOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode | null>(null);
    
    // State for "Review First" mode
    const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
    const [applyingJobs, setApplyingJobs] = useState<Record<string, ApplyStatus>>({});
    const [processingJobs, setProcessingJobs] = useState<Record<string, ProcessingStatus>>({});
    const [errorLogs, setErrorLogs] = useState<Record<string, string[]>>({});


    const isProfileComplete = profile.jobRoles && profile.locations && profile.baseCV && profile.keySkills && profile.yearsOfExperience;

    const startSearch = async (mode: SearchMode) => {
        setIsModeModalOpen(false);
        if (!isProfileComplete) return;
        
        setIsLoading(true);
        setError(null);
        setFoundJobs([]);
        setAgentMessage(null);
        setSearchMode(mode);
        setSelectedJobIds(new Set());
        setApplyingJobs({});
        setProcessingJobs({});
        setErrorLogs({});

        try {
            const jobs = await generateJobs(profile);
            
            if (mode === 'autonomous') {
                await handleAutonomousMode(jobs);
            } else { // Review mode
                setFoundJobs(jobs.filter(job => !trackedJobIds.has(job.id)));
                if (jobs.length > 0) {
                     onAgentMessage(`Hi ${profile.name}! I've found ${jobs.length} potential jobs for you. Review them and decide on the next action.`);
                }
            }

            if (jobs.length === 0) {
                const noJobsFoundMsg = "I couldn't find any new jobs matching your profile right now. You might want to try broadening your criteria in your profile or check back later.";
                setError(noJobsFoundMsg);
                onAgentMessage(`Hi ${profile.name}. ${noJobsFoundMsg}`);
            }
        } catch (err) {
            setError('Failed to fetch jobs. Please check your API key and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (commandedSearch) {
            startSearch(commandedSearch.mode);
            onCommandedSearchHandled();
        }
    }, [commandedSearch, onCommandedSearchHandled]);


    const handleAutonomousMode = async (jobs: Job[]) => {
        const newJobsForReview: Job[] = [];
        const failedAutoApplyJobs: Job[] = [];
        let autoAppliedCount = 0;

        for (const job of jobs) {
             if (trackedJobIds.has(job.id)) continue;

            if (profile.autonomousMode && job.fitScore && job.fitScore >= AUTONOMOUS_APPLY_THRESHOLD) {
                const result = await onAutoApply(job);
                if (result.success) {
                    autoAppliedCount++;
                } else {
                    failedAutoApplyJobs.push(job);
                    setErrorLogs(prev => ({...prev, [job.id]: result.log }));
                }
            } else {
                newJobsForReview.push(job);
            }
        }
        
        setFoundJobs([...newJobsForReview, ...failedAutoApplyJobs]);
        
        let autoApplySuccessMsg = autoAppliedCount > 0 ? `I've successfully and autonomously applied to ${autoAppliedCount} high-match job(s) for you.` : '';
        let autoApplyFailMsg = failedAutoApplyJobs.length > 0 ? `I attempted to apply to ${failedAutoApplyJobs.length} other high-match job(s) but encountered an issue. I've added them below for your review.` : '';
        let reviewMsg = newJobsForReview.length > 0 ? `I also found ${newJobsForReview.length} other promising role(s) for you to check out.` : '';
        
        const allMessages = [autoApplySuccessMsg, autoApplyFailMsg, reviewMsg].filter(Boolean);
        if (allMessages.length > 0) {
            const fullMessage = allMessages.join(' ');
            onAgentMessage(fullMessage);
            setAgentMessage(fullMessage);
        }
    };
    
    const handleApplyJob = async (job: Job) => {
        setProcessingJobs(prev => ({...prev, [job.id]: 'applying' }));
        const result = await onAutoApply(job);
        setProcessingJobs(prev => {
            const { [job.id]: _, ...rest } = prev;
            return rest;
        });
        setApplyingJobs(prev => ({...prev, [job.id]: result.success ? 'success' : 'error' }));

        if (result.success) {
            setTimeout(() => {
                setFoundJobs(prev => prev.filter(j => j.id !== job.id));
            }, 2000);
        } else {
            setErrorLogs(prev => ({...prev, [job.id]: result.log}));
        }
    };
    
    const handleTrackJob = useCallback(async (job: Job) => {
        setProcessingJobs(prev => ({ ...prev, [job.id]: 'tracking' }));
        await onTrackJob(job);
        setProcessingJobs(prev => {
            const { [job.id]: _, ...rest } = prev;
            return rest;
        });
    }, [onTrackJob]);

    const handleGenerateForJob = async (job: Job, type: GenerationType) => {
        const statusKey = type === GenerationType.CV ? 'generating-cv' : 'generating-cl';
        setProcessingJobs(prev => ({ ...prev, [job.id]: statusKey }));
        await onGenerate(job, type);
        setProcessingJobs(prev => {
            const { [job.id]: _, ...rest } = prev;
            return rest;
        });
    };

    const handleBatchTrack = () => {
        const jobsToTrack = foundJobs.filter(job => selectedJobIds.has(job.id));
        if (jobsToTrack.length > 0) {
            onBatchTrackJobs(jobsToTrack);
            onAgentMessage(`Successfully tracked ${jobsToTrack.length} job(s). You can find them in 'My Applications'.`);
        }
        setSelectedJobIds(new Set());
    };

    const handleBatchGenerate = async (type: GenerationType) => {
        const jobsToProcess = foundJobs.filter(job => selectedJobIds.has(job.id));
        const statusKey = type === GenerationType.CV ? 'generating-cv' : 'generating-cl';

        const newProcessingIds = { ...processingJobs };
        jobsToProcess.forEach(job => { newProcessingIds[job.id] = statusKey; });
        setProcessingJobs(newProcessingIds);

        await Promise.all(jobsToProcess.map(job => onGenerate(job, type)));
        
        onAgentMessage(`Successfully generated ${type}s for ${jobsToProcess.length} job(s).`);
        setSelectedJobIds(new Set());
    };

    const handleBatchApply = async () => {
        const jobsToApply = foundJobs.filter(job => selectedJobIds.has(job.id));
        let successCount = 0;
        let failCount = 0;

        const newProcessingIds = { ...processingJobs };
        jobsToApply.forEach(job => { newProcessingIds[job.id] = 'applying'; });
        setProcessingJobs(newProcessingIds);

        const newErrorLogs = { ...errorLogs };

        for (const job of jobsToApply) {
            const result = await onAutoApply(job);
            setApplyingJobs(prev => ({ ...prev, [job.id]: result.success ? 'success' : 'error' }));
            if (result.success) {
                 successCount++;
            } else {
                 failCount++;
                 newErrorLogs[job.id] = result.log;
            }
        }
        
        setProcessingJobs({});
        setErrorLogs(newErrorLogs);
        
        onAgentMessage(`Batch application complete! I successfully applied to ${successCount} jobs. There were issues with ${failCount} jobs, which remain in the list for your review. All applications are now in the 'My Applications' tab.`);
        setSelectedJobIds(new Set());
        setTimeout(() => {
             setFoundJobs(prev => prev.filter(job => applyingJobs[job.id] !== 'success'));
        }, 3000);
    };


    const handleSelectJob = (jobId: string) => {
        setSelectedJobIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = () => {
        const untrackedJobs = foundJobs.filter(j => !trackedJobIds.has(j.id));
        if (selectedJobIds.size === untrackedJobs.length) {
            setSelectedJobIds(new Set());
        } else {
            setSelectedJobIds(new Set(untrackedJobs.map(j => j.id)));
        }
    };

    return (
        <div className="space-y-8">
            <SearchModeModal isOpen={isModeModalOpen} onClose={() => setIsModeModalOpen(false)} onSelectMode={startSearch} autonomousModeEnabled={profile.autonomousMode} />
            <div className="bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-2">Let the AI Find Your Next Job</h2>
                <p className="text-slate-400 mb-4">
                    Choose a mode: let the agent work autonomously or review its findings first before it applies.
                </p>
                {!isProfileComplete ? (
                    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 p-4 rounded-md text-center">
                        <p className="font-semibold">Your profile is incomplete.</p>
                        <p className="text-sm">Please fill out all fields in your profile to enable the agent.</p>
                        <button 
                            onClick={() => onSwitchTab('My Profile')}
                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                           Go to Profile
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsModeModalOpen(true)}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-indigo-500/50"
                    >
                         <Icon icon="search" className="mr-2 h-5 w-5" />
                        {isLoading ? 'Agent is searching...' : 'Activate Job Search Agent'}
                    </button>
                )}
            </div>
            
            {isLoading && (
                <div className="text-center py-10">
                    <Spinner size="lg" />
                    <p className="mt-4 text-slate-400">AI agent is scanning the web and analyzing opportunities...</p>
                </div>
            )}
            
            {agentMessage && <p className="text-center text-purple-300 p-4 bg-purple-900/50 rounded-md">{agentMessage}</p>}
            {error && <p className="text-center text-red-400 p-4 bg-red-900/50 rounded-md">{error}</p>}

            {searchMode === 'review' && !isLoading && foundJobs.length > 0 && (
                <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="select-all-checkbox"
                                className="h-5 w-5 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700"
                                onChange={handleSelectAll}
                                checked={foundJobs.filter(j => !trackedJobIds.has(j.id)).length > 0 && selectedJobIds.size === foundJobs.filter(j => !trackedJobIds.has(j.id)).length}
                            />
                            <label htmlFor="select-all-checkbox" className="ml-3 text-sm font-medium text-slate-300">
                                Select All Untracked ({selectedJobIds.size} selected)
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {foundJobs.map(job => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onTrack={handleTrackJob}
                                onGenerate={handleGenerateForJob}
                                onApply={handleApplyJob}
                                isAlreadyTracked={trackedJobIds.has(job.id)}
                                selectable={true}
                                isSelected={selectedJobIds.has(job.id)}
                                onSelect={handleSelectJob}
                                applyStatus={applyingJobs[job.id]}
                                processingStatus={processingJobs[job.id]}
                                errorLog={errorLogs[job.id]}
                            />
                        ))}
                    </div>
                </div>
            )}
            
             {searchMode === 'review' && selectedJobIds.size > 0 && (
                <div className="sticky bottom-4 z-20 flex justify-center items-center p-3 bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700 gap-2 flex-wrap">
                    <span className="text-white font-bold text-lg mr-4">{selectedJobIds.size} Selected</span>
                     <button onClick={handleBatchTrack} className="inline-flex items-center justify-center px-4 py-2 border border-slate-500 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700">
                        <Icon icon="briefcase" className="mr-2 h-5 w-5" /> Track
                    </button>
                    <button onClick={() => handleBatchGenerate(GenerationType.CV)} className="inline-flex items-center justify-center px-4 py-2 border border-sky-500 text-sm font-medium rounded-md text-sky-300 hover:bg-sky-500/20">
                        <Icon icon="documentText" className="mr-2 h-5 w-5" /> Generate CVs
                    </button>
                    <button onClick={() => handleBatchGenerate(GenerationType.COVER_LETTER)} className="inline-flex items-center justify-center px-4 py-2 border border-teal-500 text-sm font-medium rounded-md text-teal-300 hover:bg-teal-500/20">
                        <Icon icon="edit" className="mr-2 h-5 w-5" /> Generate Letters
                    </button>
                    <button onClick={handleBatchApply} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                        <Icon icon="sparkles" className="mr-2 h-5 w-5" /> Apply to All
                    </button>
                </div>
            )}

            {searchMode === 'autonomous' && !isLoading && foundJobs.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    {foundJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onTrack={handleTrackJob}
                            isAlreadyTracked={trackedJobIds.has(job.id)}
                            errorLog={errorLogs[job.id]}
                        />
                    ))}
                </div>
            )}

            {!isLoading && !error && foundJobs.length === 0 && searchMode && (
                <div className="text-center py-16 px-6 bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-700">
                    <Icon icon="briefcase" className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg font-medium text-slate-300">Search Complete</h3>
                    <p className="mt-1 text-sm text-slate-400">
                       The agent didn't find any new jobs this time. Try again later or adjust your profile.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FindJobsPage;