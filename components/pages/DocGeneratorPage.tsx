
import React, { useState } from 'react';
import type { UserProfile, Job, Experiment } from '../../types';
import { generateTailoredCV, generateCoverLetter } from '../../services/geminiService';
import { Icon } from '../common/Icon';
import GeneratedDocumentCard from '../common/GeneratedDocumentCard';
import Spinner from '../common/Spinner';

interface DocGeneratorPageProps {
    profile: UserProfile;
    experiments: Experiment[];
}

type LoadingState = 'none' | 'cv' | 'cl';

const DocGeneratorPage: React.FC<DocGeneratorPageProps> = ({ profile, experiments }) => {
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    const [generatedCV, setGeneratedCV] = useState('');
    const [generatedCL, setGeneratedCL] = useState('');

    const [loading, setLoading] = useState<LoadingState>('none');
    
    const isProfileIncomplete = !profile.baseCV || !profile.name;
    const isFormIncomplete = !jobTitle.trim() || !companyName.trim() || !jobDescription.trim();

    const handleGenerate = async (type: 'cv' | 'cl') => {
        if (isProfileIncomplete || isFormIncomplete) return;

        setLoading(type);
        if(type === 'cv') setGeneratedCV(''); else setGeneratedCL('');

        const job: Job = {
            id: 'ondemand-job',
            title: jobTitle,
            company: companyName,
            description: jobDescription,
            location: '',
            salary: '',
        };

        const activeExperimentsForCV = experiments.filter(e => e.status === 'active');

        try {
            const result =
                type === 'cv'
                    ? await generateTailoredCV(profile, job, activeExperimentsForCV)
                    : await generateCoverLetter(profile, job);
            
            if (type === 'cv') {
                setGeneratedCV(result);
            } else {
                setGeneratedCL(result);
            }
        } catch (error) {
            console.error(`Error generating document: ${type}`, error);
            const errorMessage = `Failed to generate ${type}. Please try again.`;
            if (type === 'cv') setGeneratedCV(errorMessage); else setGeneratedCL(errorMessage);
        } finally {
            setLoading('none');
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="text-center">
                <Icon icon="document-duplicate" className="mx-auto h-12 w-12 text-slate-400" />
                <h2 className="mt-2 text-3xl font-bold text-white">On-Demand Document Generator</h2>
                <p className="mt-2 max-w-2xl mx-auto text-lg text-slate-400">
                    Found a job on your own? Paste the details here and let your AI agent instantly craft a tailored CV or cover letter for you.
                </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-700">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                            <input type="text" id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Senior Frontend Developer"/>
                        </div>
                         <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                            <input type="text" id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Acme Corporation"/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                        <textarea id="jobDescription" rows={10} value={jobDescription} onChange={e => setJobDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Paste the full job ad text here..."/>
                    </div>
                </div>
                 <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                        onClick={() => handleGenerate('cv')}
                        disabled={isFormIncomplete || isProfileIncomplete || loading !== 'none'}
                        className="inline-flex items-center justify-center px-6 py-2 border border-sky-500 text-sm font-medium rounded-md shadow-sm text-sky-300 hover:bg-sky-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:opacity-50"
                    >
                         {loading === 'cv' ? <Spinner size="sm" /> : <Icon icon="edit" className="mr-2 h-5 w-5" />}
                        {loading === 'cv' ? 'Generating CV...' : 'Generate Tailored CV'}
                    </button>
                    <button
                        onClick={() => handleGenerate('cl')}
                        disabled={isFormIncomplete || isProfileIncomplete || loading !== 'none'}
                        className="inline-flex items-center justify-center px-6 py-2 border border-teal-500 text-sm font-medium rounded-md shadow-sm text-teal-300 hover:bg-teal-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 disabled:opacity-50"
                    >
                        {loading === 'cl' ? <Spinner size="sm" /> : <Icon icon="documentText" className="mr-2 h-5 w-5" />}
                        {loading === 'cl' ? 'Generating Letter...' : 'Generate Cover Letter'}
                    </button>
                 </div>
                 {isProfileIncomplete && (
                    <p className="text-center text-xs text-yellow-400 mt-4">Please complete your profile (including uploading a base CV) to enable document generation.</p>
                 )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GeneratedDocumentCard 
                    title="Generated CV"
                    content={generatedCV}
                    isLoading={loading === 'cv'}
                    fileName={`${companyName}_${jobTitle}_CV`.replace(/ /g, '_')}
                />
                 <GeneratedDocumentCard 
                    title="Generated Cover Letter"
                    content={generatedCL}
                    isLoading={loading === 'cl'}
                    fileName={`${companyName}_${jobTitle}_CoverLetter`.replace(/ /g, '_')}
                />
            </div>

        </div>
    );
};

export default DocGeneratorPage;