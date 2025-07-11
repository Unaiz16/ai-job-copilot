

import React from 'react';
import type { Application, AgentInsight, Experiment, ExperimentProposal } from '../../types';
import { ApplicationStatus } from '../../types';
import { Icon } from '../common/Icon';
import Spinner from '../common/Spinner';

interface DashboardPageProps {
    applications: Application[];
    onAnalyze: () => void;
    isAnalyzing: boolean;
    insights: AgentInsight | null;
    experiments: Experiment[];
    onAcceptExperiment: (proposal: ExperimentProposal) => void;
}

const FunnelStep: React.FC<{ icon: 'applications' | 'briefcase' | 'check-circle', label: string, count: number, color: string }> = ({ icon, label, count, color }) => (
    <div className="flex-1 flex flex-col items-center p-4 bg-slate-800 rounded-lg">
        <div className={`p-3 rounded-full bg-${color}-500/10`}>
            <Icon icon={icon} className={`h-8 w-8 text-${color}-400`} />
        </div>
        <p className="mt-2 text-3xl font-bold text-white">{count}</p>
        <p className="text-sm font-medium text-slate-400">{label}</p>
    </div>
);

const ExperimentCard: React.FC<{
    experiment: Experiment | ExperimentProposal, 
    status: 'proposed' | 'active' | 'completed',
    onAccept?: (proposal: ExperimentProposal) => void,
}> = ({ experiment, status, onAccept }) => {
    let statusColor = 'text-slate-400';
    if (status === 'active') statusColor = 'text-yellow-400';
    if (status === 'completed') statusColor = 'text-green-400';

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-sky-400 mb-2">
                        {status === 'proposed' ? 'Experiment Proposal' : 'Active Experiment'}
                    </h3>
                    <p className={`text-sm font-bold uppercase ${statusColor}`}>{status}</p>
                </div>
                 <Icon icon="beaker" className="h-8 w-8 text-sky-500" />
            </div>
            <div className="mt-4 space-y-3">
                <div>
                    <p className="font-semibold text-slate-300">Hypothesis:</p>
                    <p className="text-slate-400">{experiment.hypothesis}</p>
                </div>
                 <div>
                    <p className="font-semibold text-slate-300">Method:</p>
                    <p className="text-slate-400">{experiment.method}</p>
                </div>
            </div>
            {status === 'proposed' && onAccept && (
                <div className="mt-4 pt-4 border-t border-slate-600 flex justify-end">
                    <button 
                        onClick={() => onAccept(experiment as ExperimentProposal)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        Accept Experiment
                    </button>
                </div>
            )}
        </div>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ applications, onAnalyze, isAnalyzing, insights, experiments, onAcceptExperiment }) => {
    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {} as Record<ApplicationStatus, number>);

    const appliedCount = (statusCounts[ApplicationStatus.Applied] || 0) + (statusCounts[ApplicationStatus.AppliedByAgent] || 0);
    const interviewingCount = statusCounts[ApplicationStatus.Interviewing] || 0;
    const offerCount = statusCounts[ApplicationStatus.Offer] || 0;
    
    const activeExperiments = experiments.filter(e => e.status === 'active');

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Agent Dashboard</h2>
                <p className="text-slate-400 mt-1">Your command center for the job search. Here's your current funnel.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <FunnelStep icon="applications" label="Applied" count={appliedCount} color="blue" />
                <div className="text-slate-600 font-bold text-2xl hidden sm:block">→</div>
                <FunnelStep icon="briefcase" label="Interviewing" count={interviewingCount} color="yellow" />
                 <div className="text-slate-600 font-bold text-2xl hidden sm:block">→</div>
                <FunnelStep icon="check-circle" label="Offers" count={offerCount} color="green" />
            </div>
            
            {activeExperiments.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white">Active Strategy Experiments</h3>
                    {activeExperiments.map(exp => (
                        <ExperimentCard key={exp.id} experiment={exp} status="active" />
                    ))}
                </div>
            )}


            <div className="bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Performance Analysis</h3>
                        <p className="text-slate-400 mt-1">Let the agent analyze your application history to find strategic insights and propose experiments.</p>
                    </div>
                    <button
                        onClick={onAnalyze}
                        disabled={isAnalyzing || applications.length < 3}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                <Icon icon="sparkles" className="mr-2 h-5 w-5" />
                                Analyze Performance
                            </>
                        )}
                    </button>
                </div>
                 {applications.length < 3 && !isAnalyzing && (
                    <p className="text-center text-sm text-yellow-400 mt-4 p-3 bg-yellow-900/40 rounded-md">
                        You need at least 3 tracked applications for the agent to provide meaningful insights.
                    </p>
                )}
            </div>
            
            {isAnalyzing && (
                 <div className="text-center py-10">
                    <Spinner size="lg" />
                    <p className="mt-4 text-slate-400">Agent is analyzing your strategy...</p>
                </div>
            )}

            {insights && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h3 className="text-xl font-bold text-green-400 mb-3">What's Working Well</h3>
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {insights.positivePatterns.map((pattern, i) => <li key={i}>{pattern}</li>)}
                            </ul>
                        </div>
                         <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <h3 className="text-xl font-bold text-yellow-400 mb-3">Areas for Improvement</h3>
                             <ul className="list-disc list-inside space-y-2 text-slate-300">
                                {insights.improvementAreas.map((area, i) => <li key={i}>{area}</li>)}
                            </ul>
                        </div>
                    </div>
                     <div className="space-y-6">
                        <div className="bg-purple-900/30 rounded-lg p-6 border border-purple-700">
                            <div className="flex items-start">
                                 <Icon icon="lightbulb" className="h-8 w-8 text-purple-400 mr-4 flex-shrink-0" />
                                 <div>
                                    <h3 className="text-xl font-bold text-purple-300">Proactive Suggestion</h3>
                                    <p className="text-slate-200 mt-2">{insights.proactiveSuggestion}</p>
                                </div>
                            </div>
                        </div>
                        {insights.proposal && (
                            <ExperimentCard 
                                experiment={insights.proposal}
                                status="proposed"
                                onAccept={onAcceptExperiment}
                            />
                        )}
                     </div>
                </div>
            )}

        </div>
    );
};

export default DashboardPage;