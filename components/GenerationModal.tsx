
import React, { useState, useEffect } from 'react';
import Spinner from './common/Spinner';
import { Icon } from './common/Icon';
import { marked } from 'marked';

interface GenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    isLoading: boolean;
    fileName: string;
    renderAsMarkdown?: boolean;
    onStartMockInterview?: () => void;
}

const GenerationModal: React.FC<GenerationModalProps> = ({ isOpen, onClose, title, content, isLoading, fileName, renderAsMarkdown = false, onStartMockInterview }) => {
    const [copied, setCopied] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');

    useEffect(() => {
        if (isOpen && renderAsMarkdown && content) {
            marked.setOptions({
              breaks: true,
            });
            const parsedHtml = marked.parse(content);
            setHtmlContent(parsedHtml as string);
        }
    }, [content, renderAsMarkdown, isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const fileExtension = renderAsMarkdown ? 'md' : 'txt';
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 id="modal-title" className="text-lg font-semibold text-slate-100">{title}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <Icon icon="close" className="h-6 w-6" />
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto" aria-labelledby="modal-title">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Spinner size="lg" />
                            <p className="mt-4 text-slate-400">Agent is generating content...</p>
                        </div>
                    ) : renderAsMarkdown ? (
                         <div
                            className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-sky-400 prose-a:text-teal-400 prose-strong:text-slate-100"
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    ) : (
                        <textarea
                            readOnly
                            aria-label="Generated content"
                            className="w-full h-full min-h-[400px] bg-slate-900/50 border border-slate-600 rounded-md p-4 text-slate-300 focus:ring-0 focus:outline-none resize-none font-mono text-sm"
                            value={content}
                        />
                    )}
                </div>

                <div className="flex justify-between items-center gap-4 p-4 border-t border-slate-700 flex-shrink-0">
                    <div>
                        {renderAsMarkdown && onStartMockInterview && !isLoading && (
                            <button
                                onClick={onStartMockInterview}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                            >
                                <Icon icon="microphone" className="mr-2 h-5 w-5" />
                                Start Mock Interview
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCopy} className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 transition-colors">
                            <Icon icon="copy" className="mr-2 h-4 w-4" />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={handleDownload} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                             <Icon icon="download" className="mr-2 h-4 w-4" />
                             Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerationModal;
