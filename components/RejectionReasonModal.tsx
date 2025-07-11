
import React, { useState } from 'react';
import { Icon } from './common/Icon';

interface RejectionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reason: string) => void;
    companyName: string;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({ isOpen, onClose, onSave, companyName }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(reason || "No reason provided.");
        setReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-100">Rejection Feedback</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full">
                        <Icon icon="close" className="h-6 w-6" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-slate-300 mb-4">
                        Provide feedback for the application at <span className="font-bold text-white">{companyName}</span>. This helps the agent learn and improve its strategy.
                    </p>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., 'Received an automated rejection email', 'Position was filled internally', 'Failed the initial technical screen...'"
                        className="w-full h-24 bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Rejection reason"
                    />
                </div>

                <div className="flex justify-end items-center gap-4 p-4 border-t border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Save Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectionReasonModal;
