import React, { useState } from 'react';
import type { Job } from '../types';
import { GenerationType } from '../types';
import Spinner from './common/Spinner';
import { Icon } from './common/Icon';

interface JobCardProps {
    job: Job;
    onTrack: (job: Job) => void;
    isAlreadyTracked: boolean;
    // New props for "Review First" mode
    selectable?: boolean;
    isSelected?: boolean;
    onSelect?: (jobId: string) => void;
    onApply?: (job: Job) => void;
    onGenerate?: (job: Job, type: GenerationType) => void;
    applyStatus?: 'applying' | 'success' | 'error';
    processingStatus?: 'tracking' | 'generating-cv' | 'generating-cl' | 'applying';
    errorLog?: string[];
}

const FitScoreBadge: React.FC<{ score?: number }> = ({ score }) => {
    if (score === undefined) return null;

    let bgColor = 'bg-slate-600';
    if (score >= 90) bgColor = 'bg-green-500';
    else if (score >= 75) bgColor = 'bg-yellow-500';
    
    return (
        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${bgColor}`}>
            Fit: {score}%
        </span>
    );
};

const ActionButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    isProcessing: boolean;
    text: string;
    processingText: string;
    icon: 'edit' | 'documentText' | 'briefcase' | 'sparkles';
    colorClasses: string;
}> = ({ onClick, disabled, isProcessing, text, processingText, icon, colorClasses }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 inline-flex items-center justify-center px-3 py-1.5 border text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${colorClasses}`}
    >
        {isProcessing ? (
            <>
                <Spinner size="sm" />
                <span className="ml-2">{processingText}</span>
            </>
        ) : (
            <>
                <Icon icon={icon} className="mr-1.5 h-4 w-4" />
                {text}
            </>
        )}
    </button>
);


const JobCard: React.FC<JobCardProps> = ({ job, onTrack, isAlreadyTracked, selectable, isSelected, onSelect, onApply, onGenerate, applyStatus, processingStatus, errorLog }) => {
    const [isLogVisible, setIsLogVisible] = useState(false);
    const isProcessing = !!processingStatus || applyStatus === 'applying';
    const isDone = applyStatus === 'success' || applyStatus === 'error';
    const isDisabled = isProcessing || isAlreadyTracked || isDone;

    return (
        <div className={`relative bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${isProcessing ? 'ring-2 ring-purple-500' : ''} ${applyStatus === 'success' ? 'ring-2 ring-green-500' : ''} ${applyStatus === 'error' ? 'ring-2 ring-red-500' : ''}`}>
             {selectable && onSelect && (
                <div className="absolute top-4 left-4 z-10">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(job.id)}
                        disabled={isDisabled}
                        className="h-5 w-5 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-700 disabled:cursor-not-allowed"
                        aria-label={`Select job: ${job.title}`}
                    />
                </div>
            )}
            <div className={`p-6 ${selectable ? 'pl-12' : ''}`}>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-sky-400">{job.title}</h3>
                        <p className="text-md text-slate-300 font-semibold">{job.company}</p>
                        <p className="text-sm text-slate-400">{job.location}</p>
                        <p className="text-sm text-teal-400 mt-1 font-medium">{job.salary}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                         <div className="flex items-center gap-3">
                            {applyStatus === 'applying' && <Spinner size="sm" />}
                            {applyStatus === 'success' && <Icon icon="check-circle" className="h-6 w-6 text-green-500" />}
                            {applyStatus === 'error' && <Icon icon="close" className="h-6 w-6 text-red-500" />}
                            <FitScoreBadge score={job.fitScore} />
                            {job.sourceUrl && (
                                <a
                                    href={job.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1.5 border border-slate-600 text-xs font-medium rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors"
                                >
                                    View Source
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {job.reasoning && (
                    <div className="mt-4 p-3 bg-slate-900/50 rounded-md border border-slate-700">
                        <p className="text-sm text-slate-400"><span className="font-bold text-slate-300">Agent's Note:</span> {job.reasoning}</p>
                    </div>
                )}
                
                {applyStatus === 'error' && errorLog && (
                    <div className="mt-4 p-3 bg-red-900/30 rounded-md border border-red-700/50">
                        <button 
                            onClick={() => setIsLogVisible(!isLogVisible)} 
                            className="w-full text-left text-xs font-medium text-red-300 hover:text-white flex justify-between items-center"
                        >
                            <span>Agent application failed. Click to see why.</span>
                            <Icon icon={isLogVisible ? 'close' : 'chat-bubble-left-right'} className="h-4 w-4 flex-shrink-0" />
                        </button>
                        {isLogVisible && (
                             <div className="mt-2 text-xs text-slate-300 border-t border-red-700/50 pt-2">
                                <p className="font-bold mb-1">Last Log Entry:</p>
                                <p className="font-mono bg-slate-900 p-2 rounded break-words">{errorLog[errorLog.length - 1]}</p>
                            </div>
                        )}
                    </div>
                )}

                 {/* Action Buttons for Review Mode */}
                {onGenerate && onApply && (
                    <div className="mt-4 pt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-2">
                        {isAlreadyTracked ? (
                             <div className="w-full text-center py-2 text-sm font-semibold text-green-400 bg-green-900/40 rounded-md">
                                Already Tracked
                            </div>
                        ) : (
                            <>
                                <ActionButton
                                    onClick={() => onTrack(job)}
                                    disabled={isDisabled}
                                    isProcessing={processingStatus === 'tracking'}
                                    text="Track Job"
                                    processingText="Tracking..."
                                    icon="briefcase"
                                    colorClasses="border-slate-500 text-slate-300 hover:bg-slate-700 focus:ring-slate-400"
                                />
                                <ActionButton
                                    onClick={() => onGenerate(job, GenerationType.CV)}
                                    disabled={isDisabled}
                                    isProcessing={processingStatus === 'generating-cv'}
                                    text="Generate CV"
                                    processingText="Generating..."
                                    icon="documentText"
                                    colorClasses="border-sky-500 text-sky-300 hover:bg-sky-500/20 focus:ring-sky-500"
                                />
                                <ActionButton
                                    onClick={() => onGenerate(job, GenerationType.COVER_LETTER)}
                                    disabled={isDisabled}
                                    isProcessing={processingStatus === 'generating-cl'}
                                    text="Generate Letter"
                                    processingText="Generating..."
                                    icon="edit"
                                    colorClasses="border-teal-500 text-teal-300 hover:bg-teal-500/20 focus:ring-teal-500"
                                />
                                <ActionButton
                                    onClick={() => onApply(job)}
                                    disabled={isDisabled}
                                    isProcessing={processingStatus === 'applying'}
                                    text="Apply"
                                    processingText="Applying..."
                                    icon="sparkles"
                                    colorClasses="border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
                                />
                            </>
                        )}
                    </div>
                )}
                

                <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="font-semibold text-slate-200 mb-2">Job Description</h4>
                    <p className="text-slate-400 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto pr-2">{job.description}</p>
                </div>
            </div>
        </div>
    );
};

export default JobCard;