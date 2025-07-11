
import React, { useState } from 'react';
import type { Application } from '../types';
import { ApplicationStatus, GenerationType } from '../types';
import { Icon } from './common/Icon';

interface ApplicationCardProps {
    application: Application;
    onGenerate: (app: Application, type: GenerationType) => void;
    onStatusChange: (appId: string, status: ApplicationStatus) => void;
    onPrepareInterview: (app: Application) => void;
    onAddRejectionReason: (app: Application) => void;
}

const statusColors: Record<ApplicationStatus, string> = {
    [ApplicationStatus.Tracked]: 'bg-slate-600 text-slate-100',
    [ApplicationStatus.Applied]: 'bg-blue-600 text-blue-100',
    [ApplicationStatus.AppliedByAgent]: 'bg-purple-600 text-purple-100',
    [ApplicationStatus.Interviewing]: 'bg-yellow-600 text-yellow-100',
    [ApplicationStatus.Offer]: 'bg-green-600 text-green-100',
    [ApplicationStatus.Rejected]: 'bg-red-600 text-red-100',
};

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onGenerate, onStatusChange, onPrepareInterview, onAddRejectionReason }) => {
    const [isLogVisible, setIsLogVisible] = useState(false);

    const appliedDate = application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : null;

    const handleStatusSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as ApplicationStatus;
        if (newStatus === ApplicationStatus.Rejected) {
            onAddRejectionReason(application);
        } else {
            onStatusChange(application.id, newStatus);
        }
    };

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700">
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-sky-400">{application.title}</h3>
                        <p className="text-md text-slate-300 font-semibold">{application.company}</p>
                        <p className="text-sm text-slate-400">{application.location}</p>
                         {appliedDate && application.status === ApplicationStatus.AppliedByAgent && (
                            <p className="text-xs text-purple-300 mt-1">Applied by Agent on {appliedDate}</p>
                        )}
                        {application.sourceUrl && (
                            <a 
                                href={application.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-2 inline-flex items-center text-xs text-teal-400 hover:text-teal-300 transition-colors"
                            >
                                <Icon icon="link" className="h-4 w-4 mr-1" />
                                View Original Job Posting
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={application.status}
                            onChange={handleStatusSelectChange}
                            className={`rounded-md border-0 py-1.5 pl-3 pr-8 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:ring-2 focus:ring-indigo-500 ${statusColors[application.status]}`}
                        >
                            {Object.values(ApplicationStatus).map(status => (
                                <option key={status} value={status} className="bg-slate-700 text-white">{status}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {application.rejectionReason && (
                     <div className="p-3 bg-red-900/30 rounded-md border border-red-700">
                        <p className="text-sm text-red-300"><span className="font-bold">Rejection Feedback:</span> {application.rejectionReason}</p>
                    </div>
                )}

                {application.agentLog && application.agentLog.length > 0 && (
                     <div>
                        <button onClick={() => setIsLogVisible(!isLogVisible)} className="text-xs font-medium text-slate-400 hover:text-white">
                           {isLogVisible ? 'Hide' : 'Show'} Agent Activity Log
                        </button>
                        {isLogVisible && (
                            <div className="mt-2 p-3 bg-slate-900/70 rounded-md border border-slate-600">
                                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                                    {application.agentLog.map((log, index) => <li key={index}>{log}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-4 border-t border-slate-700 flex flex-col sm:flex-row gap-4">
                    {application.tailoredCV ? (
                        <button
                            onClick={() => onGenerate(application, GenerationType.CV)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors"
                        >
                            <Icon icon="documentText" className="mr-2 h-5 w-5" />
                            View Generated CV
                        </button>
                    ) : (
                        <button
                            onClick={() => onGenerate(application, GenerationType.CV)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-teal-500 text-sm font-medium rounded-md shadow-sm text-teal-300 hover:bg-teal-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 transition-colors"
                        >
                            <Icon icon="edit" className="mr-2 h-5 w-5" />
                            Generate Tailored CV
                        </button>
                    )}
                    {application.coverLetter ? (
                         <button
                            onClick={() => onGenerate(application, GenerationType.COVER_LETTER)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors"
                        >
                            <Icon icon="documentText" className="mr-2 h-5 w-5" />
                            View Generated Letter
                        </button>
                    ) : (
                        <button
                            onClick={() => onGenerate(application, GenerationType.COVER_LETTER)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-sky-500 text-sm font-medium rounded-md shadow-sm text-sky-300 hover:bg-sky-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
                        >
                            <Icon icon="edit" className="mr-2 h-5 w-5" />
                            Generate Cover Letter
                        </button>
                    )}
                </div>
                {application.status === ApplicationStatus.Interviewing && (
                    <div className="pt-4 border-t border-slate-700">
                         <button
                            onClick={() => onPrepareInterview(application)}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-purple-500 text-sm font-medium rounded-md shadow-sm text-purple-300 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-colors"
                        >
                            <Icon icon="sparkles" className="mr-2 h-5 w-5" />
                            {application.interviewPrepKit ? 'View Interview Prep Kit' : 'Generate Interview Prep Kit'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationCard;
