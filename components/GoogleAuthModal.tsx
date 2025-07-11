import React, { useState } from 'react';
import { Icon } from './common/Icon';
import type { UserProfile } from '../types';
import Spinner from './common/Spinner';

interface GoogleAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    profile: UserProfile;
}

const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose, onSuccess, profile }) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleAllow = () => {
        setIsLoading(true);
        // Simulate API call to backend for token exchange and sheet creation
        setTimeout(() => {
            onSuccess();
            setIsLoading(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center text-slate-800 border-b">
                    <Icon icon="google-drive" className="h-16 w-16 mx-auto" />
                    <h2 className="text-xl font-bold mt-2">AI Job Copilot wants to access your Google Account</h2>
                     <p className="text-sm text-slate-600 mt-2">{profile.email || 'your-email@example.com'}</p>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-slate-700 font-medium mb-4">This will allow AI Job Copilot to:</p>
                    <ul className="space-y-3 text-sm text-slate-600">
                        <li className="flex items-start">
                            <Icon icon="check-circle" className="h-5 w-5 text-sky-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span>See, create, and edit all your Google Drive files</span>
                        </li>
                        <li className="flex items-start">
                            <Icon icon="check-circle" className="h-5 w-5 text-sky-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span>See, edit, create, and delete all your Google Sheets spreadsheets</span>
                        </li>
                    </ul>
                     <p className="text-xs text-slate-500 mt-6">
                        By clicking "Allow", you agree to the (simulated) Google Terms of Service and this app's Privacy Policy.
                    </p>
                </div>

                <div className="flex justify-end items-center gap-4 p-4 bg-slate-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-200">
                        Deny
                    </button>
                    <button 
                        onClick={handleAllow} 
                        disabled={isLoading}
                        className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 min-w-[100px]"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Allow'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleAuthModal;
