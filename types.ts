

export interface UserProfile {
  name: string;
  summary: string;
  baseCV: string;
  baseCVfilename?: string; // To display the name of the uploaded file
  jobRoles: string;
  locations: string;
  keySkills: string;
  yearsOfExperience: string;
  education?: string;
  languages?: string;
  certifications?: string;
  linkedinUrl?: string;
  gdriveLinked: boolean;
  gSheetId?: string;
  gSheetUrl?: string;
  email?: string;
  agentEmail?: string;
  agentPassword?: string;
  artifacts?: CareerArtifact[];
  minimumFitScore?: number;
  autonomousMode: boolean;
}

export interface CareerArtifact {
  id: string;
  label: string;
  content: string;
}

export interface Job {
  id:string;
  company: string;
  title: string;
  location: string;
  description:string;
  salary: string;
  sourceUrl?: string;
  fitScore?: number;
  reasoning?: string;
}

export enum ApplicationStatus {
  Tracked = 'Tracked',
  Applied = 'Applied',
  AppliedByAgent = 'Applied by Agent',
  Interviewing = 'Interviewing',
  Offer = 'Offer',
  Rejected = 'Rejected',
}

export interface Application extends Job {
  status: ApplicationStatus;
  tailoredCV?: string;
  coverLetter?: string;
  agentLog?: string[];
  appliedDate?: string;
  interviewPrepKit?: string;
  cvGdriveUrl?: string;
  coverLetterGdriveUrl?: string;
  rejectionReason?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
}

export enum ActiveTab {
  DASHBOARD = 'Dashboard',
  FIND_JOBS = 'Find Jobs',
  MY_APPLICATIONS = 'My Applications',
  DOC_GENERATOR = 'Doc Generator',
  REPORTS = 'Reports',
  PROFILE = 'My Profile',
}

export enum GenerationType {
  CV = 'CV',
  COVER_LETTER = 'Cover Letter',
}

export interface AgentInsight {
    positivePatterns: string[];
    improvementAreas: string[];
    proactiveSuggestion: string;
    proposal?: ExperimentProposal;
}

export interface ExperimentProposal {
    id: string;
    hypothesis: string;
    method: string;
}

export interface Experiment extends ExperimentProposal {
    status: 'proposed' | 'active' | 'completed';
    results?: string;
}

export type IconId = 'search' | 'profile' | 'applications' | 'briefcase' | 'download' | 'copy' | 'edit' | 'documentText' | 'sparkles' | 'assistant' | 'close' | 'microphone' | 'stop-circle' | 'arrow-path' | 'play-circle' | 'reports' | 'google-drive' | 'check-circle' | 'link' | 'dashboard' | 'lightbulb' | 'lock-closed' | 'eye' | 'eye-slash' | 'chat-bubble-left-right' | 'plus-circle' | 'trash' | 'beaker' | 'document-duplicate' | 'table-cells';

export interface ExtractedProfile {
  name?: string;
  summary?: string;
  keySkills?: string;
  jobRoles?: string;
  locations?: string;
  yearsOfExperience?: string;
  education?: string;
  languages?: string;
  certifications?: string;
  extractedText?: string;
}
