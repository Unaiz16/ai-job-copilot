import React from 'react';
import { Icon } from './common/Icon';

interface SearchModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMode: (mode: 'autonomous' | 'review') => void;
    autonomousModeEnabled: boolean;
}

const SearchModeModal: React.FC<SearchModeModalProps> = ({ isOpen, onClose, onSelectMode, autonomousModeEnabled }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-100">Choose a Search Mode</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full">
                        <Icon icon="close" className="h-6 w-6" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Review First Mode */}
                    <button
                        onClick={() => onSelectMode('review')}
                        className="flex flex-col items-center p-6 text-center bg-slate-900 rounded-lg border-2 border-slate-700 hover:border-sky-500 transition-all duration-200 transform hover:scale-105"
                    >
                        <Icon icon="eye" className="h-12 w-12 text-sky-400 mb-3" />
                        <h3 className="font-bold text-lg text-white">Review First Mode</h3>
                        <p className="text-sm text-slate-400 mt-1">Agent finds jobs for you to review and select. You command the agent to apply.</p>
                    </button>

                    {/* Autonomous Mode */}
                    <button
                        onClick={() => onSelectMode('autonomous')}
                        disabled={!autonomousModeEnabled}
                        className="flex flex-col items-center p-6 text-center bg-slate-900 rounded-lg border-2 border-slate-700 hover:border-purple-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:border-slate-700"
                    >
                         <Icon icon="sparkles" className="h-12 w-12 text-purple-400 mb-3" />
                        <h3 className="font-bold text-lg text-white">Autonomous Mode</h3>
                        <p className="text-sm text-slate-400 mt-1">Agent finds and automatically applies to high-match jobs on your behalf.</p>
                        {!autonomousModeEnabled && (
                             <span className="mt-2 text-xs text-yellow-400 font-semibold">(Enable in Profile)</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchModeModal;
