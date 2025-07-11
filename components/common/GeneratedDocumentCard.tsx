
import React, { useState } from 'react';
import Spinner from './Spinner';
import { Icon } from './Icon';

interface GeneratedDocumentCardProps {
    title: string;
    content: string;
    isLoading: boolean;
    fileName: string;
}

const GeneratedDocumentCard: React.FC<GeneratedDocumentCardProps> = ({ title, content, isLoading, fileName }) => {
    const [copied, setCopied] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-slate-800 rounded-lg shadow-md border border-slate-700 p-6 min-h-[400px] flex flex-col items-center justify-center">
                <Spinner size="lg" />
                <p className="mt-4 text-slate-400">Agent is generating {title}...</p>
            </div>
        );
    }

    if (!content) {
        return null; // Don't render anything if there's no content and it's not loading
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-slate-800/50 rounded-lg shadow-md border border-slate-700 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center px-3 py-1.5 border border-slate-600 text-xs font-medium rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                        <Icon icon="copy" className="mr-1.5 h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        <Icon icon="download" className="mr-1.5 h-4 w-4" />
                        Download
                    </button>
                </div>
            </div>
            <div className="p-4 flex-grow">
                <textarea
                    readOnly
                    className="w-full h-full min-h-[400px] bg-slate-900/50 border-none rounded-md p-4 text-slate-300 focus:ring-0 focus:outline-none resize-none font-mono text-sm"
                    value={content}
                />
            </div>
        </div>
    );
};

export default GeneratedDocumentCard;