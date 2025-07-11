import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ActiveTab, ApplicationStatus, GenerationType } from './types';
import type { UserProfile, Job, Application, AgentInsight, ChatMessage, Experiment, ExperimentProposal } from './types';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import FindJobsPage from './components/pages/FindJobsPage';
import MyApplicationsPage from './components/pages/MyApplicationsPage';
import ProfilePage from './components/pages/ProfilePage';
import ReportsPage from './components/pages/ReportsPage';
import DashboardPage from './components/pages/DashboardPage';
import DocGeneratorPage from './components/pages/DocGeneratorPage';
import GenerationModal from './components/GenerationModal';
import RejectionReasonModal from './components/RejectionReasonModal';
import { generateTailoredCV, generateCoverLetter, generateInterviewPrep, generatePerformanceInsights } from './services/geminiService';
import * as gdriveService from './services/gdriveService';
import * as gdriveSheetsService from './services/gdriveSheetsService';
import * as webAutomationService from './services/webAutomationService';
import * as dataService from './services/dataService';
import ApplicationAssistant from './components/ApplicationAssistant';
import MockInterviewModal from './components/MockInterviewModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import OnboardingModal from './components/OnboardingModal';
import SheetViewerModal from './components/SheetViewerModal';
import Spinner from './components/common/Spinner';

type SearchCommand = {
    mode: 'autonomous' | 'review';
}

const defaultProfile: UserProfile = {
    name: '', summary: '', baseCV: '', baseCVfilename: '', jobRoles: '', locations: '',
    keySkills: '', yearsOfExperience: '', autonomousMode: false, linkedinUrl: '', gdriveLinked: false,
    email: '', agentEmail: '', agentPassword: '', artifacts: [],
    education: '', languages: '', certifications: '',
    gSheetId: '', gSheetUrl: ''
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.DASHBOARD);
    const [profile, setProfile] = useState<UserProfile>(defaultProfile);
    const [applications, setApplications] = useState<Application[]>([]);
    const [experiments, setExperiments] = useState<Experiment[]>([]);

    const [isDataLoading, setIsDataLoading] = useState(true);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalFileName, setModalFileName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [modalRenderAsMarkdown, setModalRenderAsMarkdown] = useState(false);

    const [isMockInterviewOpen, setIsMockInterviewOpen] = useState(false);
    const [mockInterviewApp, setMockInterviewApp] = useState<Application | null>(null);

    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [appToUpdate, setAppToUpdate] = useState<Application | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [agentInsights, setAgentInsights] = useState<AgentInsight | null>(null);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSheetViewerOpen, setIsSheetViewerOpen] = useState(false);

    const [isOnboarding, setIsOnboarding] = useState(false);
    const [commandedSearch, setCommandedSearch] = useState<SearchCommand | null>(null);

    useEffect(() => {
        const loadAppData = async () => {
            setIsDataLoading(true);
            try {
                const [profileData, appsData, expsData] = await Promise.all([
                    dataService.getProfile(),
                    dataService.getApplications(),
                    dataService.getExperiments(),
                ]);

                const loadedProfile = profileData || defaultProfile;
                setProfile(loadedProfile);
                setApplications(appsData || []);
                setExperiments(expsData || []);
                
                const isNewUser = !loadedProfile.name;
                const onboardingSkipped = localStorage.getItem('onboardingSkipped') === 'true';
                if (isNewUser && !onboardingSkipped) {
                    setIsOnboarding(true);
                }
            } catch (error) {
                console.error("Failed to load app data from backend", error);
                setProfile(defaultProfile);
                setApplications([]);
                setExperiments([]);
            } finally {
                setIsDataLoading(false);
            }
        };
        loadAppData();
    }, []);

    const trackedJobIds = useMemo(() => new Set(applications.map(app => app.id)), [applications]);

    const addAgentMessage = useCallback((text: string) => {
        if (!text) return;
        setMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'agent', text }]);
        setHasUnreadMessages(true);
    }, []);

    const saveProfile = async (newProfile: UserProfile) => {
        setProfile(newProfile);
        await dataService.saveProfile(newProfile);
    };

    const saveApplications = useCallback(async (newApplications: Application[]) => {
        setApplications(newApplications);
        await dataService.saveApplications(newApplications);
    }, []);
    
    const saveExperiments = useCallback(async (newExperiments: Experiment[]) => {
        setExperiments(newExperiments);
        await dataService.saveExperiments(newExperiments);
    }, []);

    useEffect(() => {
        if (profile.gdriveLinked && profile.gSheetId) {
            const handler = setTimeout(() => {
                gdriveSheetsService.syncApplicationsToSheet(profile.gSheetId!, applications);
            }, 1000); 

            return () => clearTimeout(handler);
        }
    }, [applications, profile.gdriveLinked, profile.gSheetId]);

    const handleTrackJob = (job: Job) => {
        if (!trackedJobIds.has(job.id)) {
            const newApplication: Application = { ...job, status: ApplicationStatus.Tracked };
            saveApplications([newApplication, ...applications]);
        }
    };

    const handleBatchTrackJobs = (jobsToTrack: Job[]) => {
        const newApplications = jobsToTrack
            .filter(job => !trackedJobIds.has(job.id))
            .map(job => ({ ...job, status: ApplicationStatus.Tracked }));

        if (newApplications.length > 0) {
            saveApplications([...newApplications, ...applications]);
        }
    };

    const handleAutoApply = async (job: Job): Promise<{ success: boolean; log: string[] }> => {
        if (trackedJobIds.has(job.id)) return { success: true, log: ['[INFO] Job already processed.'] };

        let agentLog: string[] = [];
        let automationResult: { success: boolean; log: string[]; };

        const activeExperimentsForCV = experiments.filter(e => e.status === 'active');

        agentLog.push(`[INFO] Job found with high fit score of ${job.fitScore}%. Initiating autonomous application.`);

        agentLog.push('[INFO] Generating ATS-optimized CV...');
        const tailoredCV = await generateTailoredCV(profile, job, activeExperimentsForCV);

        agentLog.push('[INFO] Generating compelling cover letter...');
        const coverLetter = await generateCoverLetter(profile, job);

        agentLog.push('[INFO] Attempting "Easy Apply" strategy...');
        const easyApplyResult = await webAutomationService.easyApply(job, profile);
        agentLog = [...agentLog, ...easyApplyResult.log];

        if (easyApplyResult.success) {
            automationResult = easyApplyResult;
        } else if (easyApplyResult.log.some(l => l.includes('not supported for Easy Apply'))) {
            agentLog.push('[INFO] "Easy Apply" not available. Escalating to "Complex Apply" using credentials from vault...');
            const complexApplyResult = await webAutomationService.complexApply(job, profile);
            agentLog = [...agentLog, ...complexApplyResult.log];
            automationResult = complexApplyResult;
        } else {
            automationResult = easyApplyResult;
        }

        const finalStatus = automationResult.success ? ApplicationStatus.AppliedByAgent : ApplicationStatus.Tracked;

        if (automationResult.success) {
            addAgentMessage(`Hi ${profile.name}! I've just submitted your application for the ${job.title} role at ${job.company}. You can view the details in 'My Applications'.`);
        } else {
            addAgentMessage(`Hi ${profile.name}. I attempted to apply for the ${job.title} role but encountered an issue. I have tracked the job in 'My Applications' so you can review the agent log for details and apply manually if you wish.`);
        }

        let cvGdriveUrl: string | undefined = undefined;
        let coverLetterGdriveUrl: string | undefined = undefined;

        if (profile.gdriveLinked) {
            agentLog.push('[INFO] Saving documents to Google Drive...');
            cvGdriveUrl = await gdriveService.saveFile(`${job.company}_${job.title}_CV`, tailoredCV);
            coverLetterGdriveUrl = await gdriveService.saveFile(`${job.company}_${job.title}_CoverLetter`, coverLetter);
            agentLog.push('[SUCCESS] Documents saved successfully.');
        }

        agentLog.push(`[INFO] Application process finished. Final status: ${finalStatus}.`);

        const newApplication: Application = {
            ...job,
            status: finalStatus,
            tailoredCV,
            coverLetter,
            appliedDate: finalStatus === ApplicationStatus.AppliedByAgent ? new Date().toISOString() : undefined,
            agentLog,
            cvGdriveUrl,
            coverLetterGdriveUrl,
        };

        saveApplications([newApplication, ...applications]);
        return { success: automationResult.success, log: agentLog };
    };

    const handleStatusChange = async (appId: string, status: ApplicationStatus) => {
        const updatedApps = applications.map(app =>
            app.id === appId ? { ...app, status, rejectionReason: status !== ApplicationStatus.Rejected ? undefined : app.rejectionReason } : app
        );
        await saveApplications(updatedApps);
    };

    const handleGenerate = useCallback(async (appOrJob: Application | Job, type: GenerationType) => {
        if (!profile.baseCV || !profile.name) {
            alert("Please complete your profile first, including your name and base CV.");
            setActiveTab(ActiveTab.PROFILE);
            return;
        }

        const isApp = 'status' in appOrJob;
        const app: Application = isApp ? appOrJob : { ...appOrJob, status: ApplicationStatus.Tracked };

        const isCv = type === GenerationType.CV;
        const baseFileName = `${app.company}_${app.title}_${isCv ? 'CV' : 'CoverLetter'}`;

        setModalTitle(`Viewing ${isCv ? 'Tailored CV' : 'Cover Letter'} for ${app.title}`);
        setModalFileName(baseFileName);
        setModalRenderAsMarkdown(false);
        setIsModalOpen(true);

        const existingContent = isCv ? app.tailoredCV : app.coverLetter;

        if (existingContent) {
            setModalContent(existingContent);
            setIsGenerating(false);
            return;
        }

        setIsGenerating(true);
        setModalContent('');

        const activeExperimentsForCV = experiments.filter(e => e.status === 'active');

        const jobForGeneration: Job = {
            id: app.id,
            company: app.company,
            title: app.title,
            location: app.location,
            description: app.description,
            salary: app.salary,
            sourceUrl: app.sourceUrl,
            fitScore: app.fitScore,
            reasoning: app.reasoning
        };

        const generatedText = isCv
            ? await generateTailoredCV(profile, jobForGeneration, activeExperimentsForCV)
            : await generateCoverLetter(profile, jobForGeneration);

        setModalContent(generatedText);

        let newUrl: string | undefined;
        if (profile.gdriveLinked) {
            newUrl = await gdriveService.saveFile(baseFileName, generatedText);
        }

        const updatedApp = { ...app };
        if (isCv) {
            updatedApp.tailoredCV = generatedText;
            if (newUrl) updatedApp.cvGdriveUrl = newUrl;
        } else {
            updatedApp.coverLetter = generatedText;
            if (newUrl) updatedApp.coverLetterGdriveUrl = newUrl;
        }

        const appIndex = applications.findIndex(a => a.id === app.id);
        const updatedApps = appIndex > -1
            ? applications.map((a, i) => i === appIndex ? updatedApp : a)
            : [updatedApp, ...applications];

        await saveApplications(updatedApps);
        setIsGenerating(false);
    }, [profile, applications, saveApplications, experiments]);

    const handleBackgroundGenerate = useCallback(async (job: Job, type: GenerationType) => {
        if (!profile.baseCV || !profile.name) {
            alert("Please complete your profile first.");
            return;
        }

        const isCv = type === GenerationType.CV;

        const existingApp = applications.find(a => a.id === job.id);
        const appToUpdate = existingApp || { ...job, status: ApplicationStatus.Tracked, agentLog: ['[INFO] Job tracked after document generation.'] };

        if ((isCv && appToUpdate.tailoredCV) || (!isCv && appToUpdate.coverLetter)) {
            console.log("Document already exists, skipping generation.");
            return;
        }

        const activeExperimentsForCV = experiments.filter(e => e.status === 'active');
        const generatedText = isCv
            ? await generateTailoredCV(profile, job, activeExperimentsForCV)
            : await generateCoverLetter(profile, job);

        let cvGdriveUrl = appToUpdate.cvGdriveUrl;
        let coverLetterGdriveUrl = appToUpdate.coverLetterGdriveUrl;

        const baseFileName = `${job.company}_${job.title}_${isCv ? 'CV' : 'CoverLetter'}`;
        if (profile.gdriveLinked) {
            const newUrl = await gdriveService.saveFile(baseFileName, generatedText);
            if (isCv) cvGdriveUrl = newUrl; else coverLetterGdriveUrl = newUrl;
        }

        const finalApp: Application = {
            ...appToUpdate,
            tailoredCV: isCv ? generatedText : appToUpdate.tailoredCV,
            coverLetter: !isCv ? generatedText : appToUpdate.coverLetter,
            cvGdriveUrl,
            coverLetterGdriveUrl
        };

        const appIndex = applications.findIndex(a => a.id === finalApp.id);
        const updatedApps = appIndex > -1
            ? applications.map(a => a.id === finalApp.id ? finalApp : a)
            : [finalApp, ...applications];

        await saveApplications(updatedApps);
    }, [profile, applications, saveApplications, experiments]);

    const handlePrepareInterview = useCallback(async (app: Application) => {
        setIsModalOpen(true);
        setIsGenerating(true);
        setModalContent('');
        setModalRenderAsMarkdown(true);
        setModalTitle(`Interview Prep for ${app.title}`);
        setModalFileName(`${app.company}_${app.title}_InterviewPrep`);

        try {
            let prepKitContent = app.interviewPrepKit;
            if (!prepKitContent) {
                prepKitContent = await generateInterviewPrep(profile, app);
                const updatedApps = applications.map(a =>
                    a.id === app.id ? { ...a, interviewPrepKit: prepKitContent } : a
                );
                await saveApplications(updatedApps);
            }
            setModalContent(prepKitContent);
        } catch (error) {
            console.error("Failed to prepare for interview:", error);
            const errorContent = "### Error\n\nFailed to generate the interview prep kit. Please try again later.";
            setModalContent(errorContent);
        } finally {
            setIsGenerating(false);
        }
    }, [profile, applications, saveApplications]);

    const handleStartMockInterview = (app: Application) => {
        setIsModalOpen(false);
        setMockInterviewApp(app);
        setIsMockInterviewOpen(true);
    };

    const handleAddRejectionReason = (app: Application) => {
        setAppToUpdate(app);
        setIsRejectionModalOpen(true);
    };

    const handleSaveRejectionReason = async (reason: string) => {
        if (appToUpdate) {
            const updatedApps = applications.map(app =>
                app.id === appToUpdate.id ? { ...app, status: ApplicationStatus.Rejected, rejectionReason: reason } : app
            );
            await saveApplications(updatedApps);
        }
        setAppToUpdate(null);
        setIsRejectionModalOpen(false);
    };

    const handleAnalyzePerformance = async () => {
        setIsAnalyzing(true);
        setAgentInsights(null);
        const insights = await generatePerformanceInsights(profile, applications);
        setAgentInsights(insights);
        setIsAnalyzing(false);
        if (insights) {
            addAgentMessage(`I've completed the performance analysis of your recent applications. I have some strategic suggestions for you on the Dashboard. Here's the main takeaway: ${insights.proactiveSuggestion}`);
        } else {
            addAgentMessage("I tried to analyze your performance, but I couldn't generate any insights right now. This might be due to not having enough application data.");
        }
    };

    const handleAuthSuccess = async () => {
        setIsAuthModalOpen(false);
        const sheet = await gdriveSheetsService.createApplicationSheet(profile);
        if (sheet) {
            await saveProfile({ ...profile, gdriveLinked: true, gSheetId: sheet.id, gSheetUrl: sheet.url });
            addAgentMessage("Successfully linked Google Drive! I've created a new spreadsheet to sync your application pipeline.");
        } else {
            addAgentMessage("Sorry, I couldn't link your Google Drive account at this time.");
        }
    };

    const handleSyncFromSheet = async () => {
        if (!profile.gdriveLinked || !profile.gSheetId) return;

        const importedApps = await gdriveSheetsService.importApplicationsFromSheet(profile.gSheetId);

        const existingAppKeys = new Set(applications.map(app => `${app.company}-${app.title}`.toLowerCase().trim()));

        const newAppsToTrack = importedApps.filter(importedApp => {
            const key = `${importedApp.company}-${importedApp.title}`.toLowerCase().trim();
            return !existingAppKeys.has(key);
        });

        if (newAppsToTrack.length > 0) {
            const newApplicationsState = [...newAppsToTrack, ...applications];
            await saveApplications(newApplicationsState);
            addAgentMessage(`Synced with Google Sheet. Imported ${newAppsToTrack.length} new application(s).`);
        } else {
            addAgentMessage('Sync complete. No new applications found in your Google Sheet.');
        }
    };

    const handleAcceptExperiment = async (proposal: ExperimentProposal) => {
        const newExperiment: Experiment = { ...proposal, status: 'active' };
        await saveExperiments([...experiments, newExperiment]);
        setAgentInsights(prev => prev ? { ...prev, proposal: undefined } : null);
        addAgentMessage(`Great! I've activated the new experiment: "${proposal.hypothesis}". I'll apply this strategy to relevant applications going forward.`);
    };

    const handleCommand = (command: any) => {
        if (!command || !command.command) return;

        switch (command.command) {
            case 'find_jobs':
                setActiveTab(ActiveTab.FIND_JOBS);
                setCommandedSearch({ mode: command.params.mode });
                addAgentMessage(`Understood. Initiating a job search in "${command.params.mode}" mode.`);
                break;
            case 'switch_tab':
                setActiveTab(command.params.tab);
                break;
            case 'get_status':
                const company = command.params.companyName;
                const foundApp = applications.find(app => app.company.toLowerCase().includes(company.toLowerCase()));
                if (foundApp) {
                    addAgentMessage(`Your application for ${foundApp.title} at ${foundApp.company} is currently marked as: ${foundApp.status}.`);
                } else {
                    addAgentMessage(`I couldn't find any tracked application for a company named "${company}".`);
                }
                break;
            default:
                addAgentMessage("I'm not sure how to handle that command yet.");
        }
    };
    
    const handleCompleteOnboarding = async (finalProfile: UserProfile, searchMode: 'review' | 'autonomous') => {
        await saveProfile(finalProfile);
        setIsOnboarding(false);
        setActiveTab(ActiveTab.FIND_JOBS);
        setCommandedSearch({ mode: searchMode });
    };

    const handleSkipOnboarding = () => {
        localStorage.setItem('onboardingSkipped', 'true');
        setIsOnboarding(false);
        addAgentMessage("Onboarding skipped! You can set up your details on the 'My Profile' page whenever you're ready.");
    };

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Spinner size="lg" />
            </div>
        );
    }
    
    const renderContent = () => {
        if (isOnboarding) return null;

        switch (activeTab) {
            case ActiveTab.DASHBOARD:
                return <DashboardPage
                    applications={applications}
                    onAnalyze={handleAnalyzePerformance}
                    isAnalyzing={isAnalyzing}
                    insights={agentInsights}
                    experiments={experiments}
                    onAcceptExperiment={handleAcceptExperiment}
                />;
            case ActiveTab.FIND_JOBS:
                return <FindJobsPage
                    onTrackJob={handleTrackJob}
                    onAutoApply={handleAutoApply}
                    trackedJobIds={trackedJobIds}
                    profile={profile}
                    onSwitchTab={() => setActiveTab(ActiveTab.PROFILE)}
                    onAgentMessage={addAgentMessage}
                    onGenerate={handleBackgroundGenerate}
                    onBatchTrackJobs={handleBatchTrackJobs}
                    commandedSearch={commandedSearch}
                    onCommandedSearchHandled={() => setCommandedSearch(null)}
                />;
            case ActiveTab.MY_APPLICATIONS:
                return <MyApplicationsPage
                    applications={applications}
                    profile={profile}
                    onGenerate={handleGenerate}
                    onStatusChange={handleStatusChange}
                    onPrepareInterview={handlePrepareInterview}
                    onAddRejectionReason={handleAddRejectionReason}
                    onSyncFromSheet={handleSyncFromSheet}
                />;
            case ActiveTab.DOC_GENERATOR:
                return <DocGeneratorPage
                    profile={profile}
                    experiments={experiments}
                />;
            case ActiveTab.REPORTS:
                return <ReportsPage applications={applications} />;
            case ActiveTab.PROFILE:
                return <ProfilePage
                    profile={profile}
                    onSave={saveProfile}
                    onAgentMessage={addAgentMessage}
                    onLinkGoogleDrive={() => setIsAuthModalOpen(true)}
                    onViewSheet={() => setIsSheetViewerOpen(true)}
                />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            {!isOnboarding && <Header />}
            {!isOnboarding && <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} applicationCount={applications.length} />}
            <main>
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>
            {isOnboarding && (
                <OnboardingModal
                    profile={profile}
                    onComplete={handleCompleteOnboarding}
                    addAgentMessage={addAgentMessage}
                    onSkip={handleSkipOnboarding}
                />
            )}
            <GenerationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalTitle}
                content={modalContent}
                isLoading={isGenerating}
                fileName={modalFileName}
                renderAsMarkdown={modalRenderAsMarkdown}
                onStartMockInterview={() => {
                    const appForInterview = applications.find(a => modalTitle.includes(a.title));
                    if (appForInterview) handleStartMockInterview(appForInterview);
                }}
            />
            {mockInterviewApp && (
                <MockInterviewModal
                    isOpen={isMockInterviewOpen}
                    onClose={() => setIsMockInterviewOpen(false)}
                    application={mockInterviewApp}
                    profile={profile}
                />
            )}
            {appToUpdate && (
                <RejectionReasonModal
                    isOpen={isRejectionModalOpen}
                    onClose={() => setIsRejectionModalOpen(false)}
                    onSave={handleSaveRejectionReason}
                    companyName={appToUpdate.company}
                />
            )}
            <GoogleAuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
                profile={profile}
            />
            <SheetViewerModal
                isOpen={isSheetViewerOpen}
                onClose={() => setIsSheetViewerOpen(false)}
                applications={applications}
            />
            {!isOnboarding && !isDataLoading && (
                <ApplicationAssistant
                    profile={profile}
                    applications={applications}
                    messages={messages}
                    setMessages={setMessages}
                    hasUnread={hasUnreadMessages}
                    onOpen={() => setHasUnreadMessages(false)}
                    onCommand={handleCommand}
                />
            )}
        </div>
    );
};

export default App;
