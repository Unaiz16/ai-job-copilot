
import React from 'react';
import type { Application } from '../types';
import { ApplicationStatus } from '../types';
import { Icon } from './common/Icon';

interface SheetViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    applications: Application[];
}

const statusColors: Record<ApplicationStatus, string> = {
    [ApplicationStatus.Tracked]: 'bg-slate-600 text-slate-100',
    [ApplicationStatus.Applied]: 'bg-blue-600 text-blue-100',
    [ApplicationStatus.AppliedByAgent]: 'bg-purple-600 text-purple-100',
    [ApplicationStatus.Interviewing]: 'bg-yellow-600 text-yellow-100',
    [ApplicationStatus.Offer]: 'bg-green-600 text-green-100',
    [ApplicationStatus.Rejected]: 'bg-red-600 text-red-100',
};

const SheetViewerModal: React.FC<SheetViewerModalProps> = ({ isOpen, onClose, applications }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Icon icon="table-cells" className="h-6 w-6 text-green-400" />
                        <h2 className="text-lg font-semibold text-slate-100">Application Pipeline (Live View)</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full">
                        <Icon icon="close" className="h-6 w-6" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                <div className="p-2 sm:p-4 flex-grow overflow-y-auto">
                    <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-300 sm:pl-6">Company</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Job Title</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Applied On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {applications.map((app) => (
                                        <tr key={app.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{app.company}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{app.title}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                                                {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end p-4 border-t border-slate-700">
                     <button onClick={onClose} className="px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700">
                        Close Viewer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SheetViewerModal;
