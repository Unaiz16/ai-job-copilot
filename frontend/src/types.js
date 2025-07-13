// Types and enums for the AI Job Copilot application
// Adapted from TypeScript to JavaScript

export const ActiveTab = {
    DASHBOARD: 'Dashboard',
    FIND_JOBS: 'Find Jobs',
    MY_APPLICATIONS: 'My Applications',
    REPORTS: 'Reports',
    PROFILE: 'My Profile',
    DOC_GENERATOR: 'Doc Generator'
};

export const ApplicationStatus = {
    Tracked: 'Tracked',
    Applied: 'Applied',
    AppliedByAgent: 'Applied by Agent',
    Interviewing: 'Interviewing',
    Rejected: 'Rejected',
    Offer: 'Offer'
};

export const GenerationType = {
    CV: 'CV',
    COVER_LETTER: 'COVER_LETTER'
};

// Default profile structure
export const defaultProfile = {
    name: '',
    summary: '',
    baseCV: '',
    baseCVfilename: '',
    jobRoles: '',
    locations: '',
    keySkills: '',
    yearsOfExperience: '',
    autonomousMode: false,
    linkedinUrl: '',
    gdriveLinked: false,
    email: '',
    agentEmail: '',
    agentPassword: '',
    artifacts: [],
    education: '',
    languages: '',
    certifications: '',
    gSheetId: '',
    gSheetUrl: '',
    minimumFitScore: 70
};

