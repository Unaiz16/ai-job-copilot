
import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Icon } from './common/Icon';
import Spinner from './common/Spinner';
import { analyzeAnswerWithAudio } from '../services/geminiService';
import type { Application, UserProfile } from '../types';

interface MockInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application;
    profile: UserProfile;
}

type RecordingStatus = 'idle' | 'recording' | 'finished' | 'denied';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const MockInterviewModal: React.FC<MockInterviewModalProps> = ({ isOpen, onClose, application, profile }) => {
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [htmlFeedback, setHtmlFeedback] = useState('');
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioBlobRef = useRef<Blob | null>(null);

    useEffect(() => {
        if (application?.interviewPrepKit) {
            const kit = application.interviewPrepKit;
            const questionSection = kit.split('### 2. Potential Interview Questions')[1]?.split('###')[0];
            if (questionSection) {
                const parsedQuestions = questionSection
                    .split('\n')
                    .map(q => q.trim())
                    .filter(q => /^\d+\./.test(q))
                    .map(q => q.replace(/^\d+\.\s*/, '')); // remove numbering
                setQuestions(parsedQuestions);
            }
        }
    }, [application]);

    useEffect(() => {
        if (feedback) {
            setHtmlFeedback(marked.parse(feedback) as string);
        }
    }, [feedback]);
    
    const resetStateForNewQuestion = () => {
        setFeedback('');
        setHtmlFeedback('');
        setRecordingStatus('idle');
        audioBlobRef.current = null;
        audioChunksRef.current = [];
    };

    const handleStartRecording = async () => {
        resetStateForNewQuestion();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setRecordingStatus('recording');
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioBlobRef.current = audioBlob;
                setRecordingStatus('finished');
                stream.getTracks().forEach(track => track.stop()); // Stop mic access
            };
            mediaRecorderRef.current.start();
        } catch (err) {
            console.error('Microphone access denied:', err);
            setRecordingStatus('denied');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    const handleGetFeedback = async () => {
        if (!audioBlobRef.current) return;
        setIsLoading(true);
        try {
            const audioBase64 = await blobToBase64(audioBlobRef.current);
            const generatedFeedback = await analyzeAnswerWithAudio(profile, application, questions[currentIndex], audioBase64, audioBlobRef.current.type);
            setFeedback(generatedFeedback);
        } catch (error) {
            console.error("Error getting feedback", error);
            setFeedback("### Error\nSorry, could not get feedback for the answer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            resetStateForNewQuestion();
        } else {
            onClose(); // End session if it's the last question
        }
    };

    const handleRetry = () => {
        resetStateForNewQuestion();
    };

    if (!isOpen) return null;

    const currentQuestion = questions[currentIndex];

    return (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-4 sm:p-8" aria-modal="true" role="dialog">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full">
                <Icon icon="close" className="h-8 w-8" />
                <span className="sr-only">Close Mock Interview</span>
            </button>

            <div className="w-full max-w-4xl text-center">
                <p className="text-indigo-400 font-semibold">Question {currentIndex + 1} of {questions.length}</p>
                <h1 className="text-2xl sm:text-4xl font-bold text-white mt-2 mb-8">{currentQuestion}</h1>

                <div className="bg-slate-800/50 rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center border border-slate-700">
                    {isLoading ? (
                        <div className="text-center">
                            <Spinner size="lg" />
                            <p className="mt-4 text-slate-300">Agent is analyzing your answer...</p>
                        </div>
                    ) : feedback ? (
                        <div className="text-left w-full max-h-[50vh] overflow-y-auto pr-4">
                            <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-sky-400 prose-a:text-teal-400" dangerouslySetInnerHTML={{ __html: htmlFeedback }} />
                        </div>
                    ) : (
                        <>
                            {recordingStatus === 'idle' && (
                                <button onClick={handleStartRecording} className="flex flex-col items-center gap-2 text-sky-300 hover:text-sky-200 transition-colors">
                                    <Icon icon="microphone" className="h-16 w-16" />
                                    <span className="font-bold text-lg">Click to Record Answer</span>
                                </button>
                            )}
                             {recordingStatus === 'denied' && (
                                <div className="text-red-400">
                                    <p className="font-bold">Microphone access was denied.</p>
                                    <p className="text-sm">Please enable microphone permissions in your browser settings to continue.</p>
                                </div>
                            )}
                            {recordingStatus === 'recording' && (
                                <button onClick={handleStopRecording} className="flex flex-col items-center gap-2 text-red-400 hover:text-red-300 transition-colors animate-pulse">
                                    <Icon icon="stop-circle" className="h-16 w-16" />
                                    <span className="font-bold text-lg">Recording... Click to Stop</span>
                                </button>
                            )}
                            {recordingStatus === 'finished' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                     <button onClick={handleGetFeedback} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                        <Icon icon="sparkles" className="mr-2 h-5 w-5" />
                                        Get Feedback
                                    </button>
                                     <button onClick={handleRetry} className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700">
                                        <Icon icon="arrow-path" className="mr-2 h-5 w-5" />
                                        Retry Answer
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                 <div className="mt-8 flex justify-center items-center gap-6">
                    {feedback && (
                         <button onClick={handleRetry} className="inline-flex items-center px-6 py-2 border border-slate-600 text-base font-medium rounded-md text-slate-300 hover:bg-slate-700">
                             <Icon icon="arrow-path" className="mr-2 h-5 w-5" />
                            Answer Again
                         </button>
                    )}
                    <button onClick={handleNextQuestion} className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700">
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="ml-2 h-6 w-6">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default MockInterviewModal;
