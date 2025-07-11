
import React from 'react';
import type { Application } from '../../types';
import { ApplicationStatus } from '../../types';
import { Icon } from '../common/Icon';

interface ReportsPageProps {
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

const ReportsPage: React.FC<ReportsPageProps> = ({ applications }) => {

    const handleDownloadCSV = () => {
        const headers = [
            'Company', 'Title', 'Location', 'Status', 'AppliedDate', 
            'CVLink', 'CoverLetterLink', 'JobPostingURL', 'RejectionReason'
        ];
        
        const sanitizeCell = (cellData: string | undefined | null) => {
            if (cellData === undefined || cellData === null) return '';
            const str = String(cellData);
            // If the string contains a comma, double quote, or newline, enclose it in double quotes.
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                // Also, double up any existing double quotes.
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [
            headers.join(','),
            ...applications.map(app => [
                sanitizeCell(app.company),
                sanitizeCell(app.title),
                sanitizeCell(app.location),
                sanitizeCell(app.status),
                sanitizeCell(app.appliedDate ? new Date(app.appliedDate).toISOString().split('T')[0] : ''),
                sanitizeCell(app.cvGdriveUrl),
                sanitizeCell(app.coverLetterGdriveUrl),
                sanitizeCell(app.sourceUrl),
                sanitizeCell(app.rejectionReason),
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'application_report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (applications.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-700">
                <Icon icon="reports" className="mx-auto h-12 w-12 text-slate-500" />
                <h3 className="mt-2 text-lg font-medium text-slate-300">No Application Data</h3>
                <p className="mt-1 text-sm text-slate-400">
                    Track or apply for jobs to see your data here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-white">Application Report</h2>
                 <button 
                    onClick={handleDownloadCSV}
                    className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                 >
                    <Icon icon="download" className="mr-2 h-4 w-4" />
                    Download as CSV
                 </button>
            </div>
            <div className="bg-slate-800/50 rounded-lg shadow-md border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-300 sm:pl-6">Company</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Job Title</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">Status</th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-300">CV Link</th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-300">Cover Letter Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                            {applications.map((app) => (
                                <tr key={app.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{app.company}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{app.title}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                        {app.cvGdriveUrl ? (
                                            <a href={app.cvGdriveUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center">
                                                <Icon icon="link" className="h-4 w-4 mr-1" />
                                                View
                                            </a>
                                        ) : (
                                            <span className="text-slate-500">N/A</span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                         {app.coverLetterGdriveUrl ? (
                                            <a href={app.coverLetterGdriveUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 inline-flex items-center">
                                                <Icon icon="link" className="h-4 w-4 mr-1" />
                                                View
                                            </a>
                                        ) : (
                                            <span className="text-slate-500">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
