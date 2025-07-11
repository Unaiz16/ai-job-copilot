

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './common/Icon';
import Spinner from './common/Spinner';
import type { ChatMessage, UserProfile, Application } from '../types';
import { startAssistantChat, getInitialAssistantMessage, parseChatCommand } from '../services/geminiService';
import type { Chat } from '@google/genai';

interface AssistantProps {
    profile: UserProfile;
    applications: Application[];
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    hasUnread: boolean;
    onOpen: () => void;
    onCommand: (command: any) => void;
}

const ApplicationAssistant: React.FC<AssistantProps> = ({ profile, applications, messages, setMessages, hasUnread, onOpen, onCommand }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isProfileReady = !!profile.name;

    useEffect(() => {
        if (isProfileReady) {
            const newChat = startAssistantChat(profile, applications);
            setChat(newChat);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile, applications, isProfileReady]);

    useEffect(() => {
        if (chat && messages.length === 0 && isOpen && !isLoading) {
            setIsLoading(true);
            getInitialAssistantMessage(chat).then(initialText => {
                setMessages([{ id: crypto.randomUUID(), sender: 'agent', text: initialText }]);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [chat, messages.length, isOpen, isLoading, setMessages]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleToggleOpen = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (newIsOpen) {
            onOpen(); // Notify parent that chat is opened
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chat) return;

        const userMessageText = userInput.trim();
        const newUserMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'user', text: userMessageText };
        
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setUserInput('');
        setIsLoading(true);
        
        // Check for command first
        const command = await parseChatCommand(userMessageText);
        if (command) {
            onCommand(command);
            setIsLoading(false);
            return;
        }


        try {
            const stream = await chat.sendMessageStream({ message: userMessageText });
            
            let agentResponseText = '';
            const agentMessageId = crypto.randomUUID();

            setMessages(prev => [...prev, { id: agentMessageId, sender: 'agent', text: '' }]);

            for await (const chunk of stream) {
                agentResponseText += chunk.text;
                setMessages(prev => prev.map(msg => 
                    msg.id === agentMessageId ? { ...msg, text: agentResponseText } : msg
                ));
            }
        } catch (error) {
            console.error("Assistant chat failed:", error);
            const errorMsg: ChatMessage = { id: crypto.randomUUID(), sender: 'agent', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prevMessages => [...prevMessages, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isProfileReady) {
        return null; 
    }

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={handleToggleOpen}
                    className="relative bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                    aria-label="Toggle Application Assistant"
                >
                    <Icon icon={isOpen ? 'close' : 'assistant'} className="h-8 w-8" />
                    {hasUnread && !isOpen && (
                        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                </button>
            </div>

            <div className={`fixed bottom-24 right-6 z-50 w-[90vw] max-w-md h-[70vh] max-h-[700px] bg-slate-800/80 backdrop-blur-md rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <Icon icon="assistant" className="h-6 w-6 text-purple-400" />
                        <h2 className="text-lg font-bold text-slate-100">Application Assistant</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close assistant">
                        <Icon icon="close" className="h-6 w-6" />
                    </button>
                </header>

                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'agent' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center"><Icon icon="chat-bubble-left-right" className="h-5 w-5 text-white" /></div>}
                            <div className={`max-w-[85%] p-3 rounded-lg text-white ${msg.sender === 'user' ? 'bg-indigo-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text || '...'}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length-1]?.sender === 'user' && (
                         <div className="flex items-end gap-2">
                             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center"><Icon icon="chat-bubble-left-right" className="h-5 w-5 text-white" /></div>
                             <div className="max-w-[80%] p-3 rounded-lg bg-slate-700 rounded-bl-none">
                                <Spinner size="sm" />
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask or command your agent..."
                            disabled={isLoading}
                            className="w-full bg-slate-900 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                            aria-label="Chat input"
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-indigo-600 text-white rounded-md p-2 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.544l4.25-1.215a.75.75 0 01.658.658l-1.215 4.25a.75.75 0 00.544.95l4.95 1.414a.75.75 0 00.95-.826l-2.29-8.016a.75.75 0 00-.712-.712l-8.016-2.29z" />
                                <path d="M9.452 7.863a.75.75 0 10-1.06-1.06l-2.652 2.652a.75.75 0 001.06 1.06l2.652-2.652z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ApplicationAssistant;