

import React, { useState } from 'react';
import type { Application, UserProfile } from '../../types';
import { ApplicationStatus, GenerationType } from '../../types';
import ApplicationCard from '../ApplicationCard';
import { Icon } from '../common/Icon';
import Spinner from '../common/Spinner';

interface MyApplicationsPageProps {
    applications: Application[];
    profile: UserProfile;
    onGenerate: (app: Application, type: GenerationType) => void;
    onStatusChange: (appId: string, status: ApplicationStatus) => void;
    onPrepareInterview: (app: Application) => void;
    onAddRejectionReason: (app: Application) => void;
    onSyncFromSheet: () => Promise<void>;
}

const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ applications, profile, onGenerate, onStatusChange, onPrepareInterview, onAddRejectionReason, onSyncFromSheet }) => {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        await onSyncFromSheet();
        setIsSyncing(false);
    };

    const headerContent = (
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-white">My Application Pipeline</h2>
            {profile.gdriveLinked && (
                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="inline-flex items-center justify-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                >
                    {isSyncing ? (
                        <>
                            <Spinner size="sm" />
                            <span className="ml-2">Syncing...</span>
                        </>
                    ) : (
                         <>
                            <Icon icon="arrow-path" className="mr-2 h-4 w-4" />
                            Sync with Google Sheet
                        </>
                    )}
                </button>
            )}
        </div>
    );

    if (applications.length === 0) {
        return (
            <div>
                {headerContent}
                <div className="text-center py-16 px-6 bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-700">
                    <Icon icon="applications" className="mx-auto h-12 w-12 text-slate-500" />
                    <h3 className="mt-2 text-lg font-medium text-slate-300">No Tracked Applications</h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Go to the "Find Jobs" tab to search for and track new opportunities.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {headerContent}
            {applications.map(app => (
                <ApplicationCard
                    key={app.id}
                    application={app}
                    onGenerate={onGenerate}
                    onStatusChange={onStatusChange}
                    onPrepareInterview={onPrepareInterview}
                    onAddRejectionReason={onAddRejectionReason}
                />
            ))}
        </div>
    );
};

export default MyApplicationsPage;