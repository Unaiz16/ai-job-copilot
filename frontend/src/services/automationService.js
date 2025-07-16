// Automation service that orchestrates Browserless.io for job applications
// Handles the complete automation workflow from job discovery to application submission

import browserlessService from './browserlessService.js';
import apiService from './apiService.js';
import config from '../config/environment.js';

class AutomationService {
  constructor() {
    this.isRunning = false;
    this.currentTasks = new Map();
    this.taskQueue = [];
    this.maxConcurrentTasks = 3;
  }

  // Main automation orchestration
  async startAutomation(profile, searchParams, options = {}) {
    if (this.isRunning) {
      throw new Error('Automation is already running');
    }

    this.isRunning = true;
    const automationId = this.generateTaskId();
    
    try {
      const results = {
        automationId,
        startTime: new Date().toISOString(),
        profile: profile.name,
        searchParams,
        options,
        phases: {
          jobSearch: { status: 'pending', results: [] },
          applicationAnalysis: { status: 'pending', results: [] },
          applicationSubmission: { status: 'pending', results: [] }
        },
        summary: {
          jobsFound: 0,
          applicationsAttempted: 0,
          applicationsSuccessful: 0,
          errors: []
        }
      };

      // Phase 1: Job Search
      await this.executeJobSearch(results, searchParams);
      
      // Phase 2: Application Analysis
      await this.analyzeApplications(results, profile);
      
      // Phase 3: Application Submission (if in autonomous mode)
      if (options.autonomousMode) {
        await this.submitApplications(results, profile, options);
      }

      results.endTime = new Date().toISOString();
      results.duration = new Date(results.endTime) - new Date(results.startTime);
      
      return results;
      
    } catch (error) {
      console.error('Automation error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async executeJobSearch(results, searchParams) {
    results.phases.jobSearch.status = 'running';
    
    try {
      const platforms = ['stepstone.de', 'indeed.de', 'xing.de'];
      const allJobs = [];
      
      for (const platform of platforms) {
        try {
          console.log(`Searching jobs on ${platform}...`);
          const jobs = await browserlessService.searchJobs(platform, searchParams);
          
          // Add platform-specific metadata
          const enrichedJobs = jobs.map(job => ({
            ...job,
            id: this.generateJobId(job),
            platform,
            searchParams,
            discoveredAt: new Date().toISOString()
          }));
          
          allJobs.push(...enrichedJobs);
          
        } catch (platformError) {
          console.error(`Error searching ${platform}:`, platformError);
          results.summary.errors.push({
            phase: 'jobSearch',
            platform,
            error: platformError.message
          });
        }
      }
      
      // Remove duplicates based on title and company
      const uniqueJobs = this.deduplicateJobs(allJobs);
      
      results.phases.jobSearch.results = uniqueJobs;
      results.phases.jobSearch.status = 'completed';
      results.summary.jobsFound = uniqueJobs.length;
      
      console.log(`Found ${uniqueJobs.length} unique jobs across ${platforms.length} platforms`);
      
    } catch (error) {
      results.phases.jobSearch.status = 'failed';
      results.phases.jobSearch.error = error.message;
      throw error;
    }
  }

  async analyzeApplications(results, profile) {
    results.phases.applicationAnalysis.status = 'running';
    
    try {
      const jobs = results.phases.jobSearch.results;
      const analyzedJobs = [];
      
      for (const job of jobs.slice(0, 10)) { // Limit to first 10 jobs for demo
        try {
          console.log(`Analyzing application for: ${job.title} at ${job.company}`);
          
          // Detect application type
          const applicationInfo = await browserlessService.detectApplicationType(job.link);
          
          // Calculate fit score (simplified version)
          const fitScore = this.calculateFitScore(job, profile);
          
          // Generate cover letter
          const coverLetter = await this.generateCoverLetter(job, profile);
          
          const analyzedJob = {
            ...job,
            applicationInfo,
            fitScore,
            coverLetter,
            recommendation: this.getApplicationRecommendation(fitScore, applicationInfo),
            analyzedAt: new Date().toISOString()
          };
          
          analyzedJobs.push(analyzedJob);
          
        } catch (jobError) {
          console.error(`Error analyzing job ${job.id}:`, jobError);
          results.summary.errors.push({
            phase: 'applicationAnalysis',
            jobId: job.id,
            error: jobError.message
          });
        }
      }
      
      results.phases.applicationAnalysis.results = analyzedJobs;
      results.phases.applicationAnalysis.status = 'completed';
      
      console.log(`Analyzed ${analyzedJobs.length} job applications`);
      
    } catch (error) {
      results.phases.applicationAnalysis.status = 'failed';
      results.phases.applicationAnalysis.error = error.message;
      throw error;
    }
  }

  async submitApplications(results, profile, options) {
    results.phases.applicationSubmission.status = 'running';
    
    try {
      const analyzedJobs = results.phases.applicationAnalysis.results;
      const submissionResults = [];
      
      // Filter jobs for application based on criteria
      const jobsToApply = analyzedJobs.filter(job => 
        job.fitScore >= (options.minFitScore || 70) &&
        job.recommendation === 'apply'
      );
      
      console.log(`Applying to ${jobsToApply.length} jobs that meet criteria`);
      
      for (const job of jobsToApply.slice(0, 5)) { // Limit to 5 applications per run
        try {
          console.log(`Applying to: ${job.title} at ${job.company}`);
          
          let applicationResult;
          
          if (job.applicationInfo.isEasyApply) {
            applicationResult = await browserlessService.performEasyApply(
              job.link, 
              {
                ...profile,
                coverLetter: job.coverLetter
              }
            );
          } else {
            applicationResult = await browserlessService.performComplexApply(
              job.link,
              {
                ...profile,
                coverLetter: job.coverLetter
              }
            );
          }
          
          const submissionResult = {
            jobId: job.id,
            jobTitle: job.title,
            company: job.company,
            applicationMethod: job.applicationInfo.isEasyApply ? 'Easy Apply' : 'Complex Apply',
            success: applicationResult.success,
            steps: applicationResult.steps,
            error: applicationResult.error,
            submittedAt: new Date().toISOString()
          };
          
          submissionResults.push(submissionResult);
          
          if (applicationResult.success) {
            results.summary.applicationsSuccessful++;
          }
          
          results.summary.applicationsAttempted++;
          
          // Add delay between applications to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 5000));
          
        } catch (applicationError) {
          console.error(`Error applying to job ${job.id}:`, applicationError);
          results.summary.errors.push({
            phase: 'applicationSubmission',
            jobId: job.id,
            error: applicationError.message
          });
        }
      }
      
      results.phases.applicationSubmission.results = submissionResults;
      results.phases.applicationSubmission.status = 'completed';
      
      console.log(`Completed ${submissionResults.length} application attempts`);
      
    } catch (error) {
      results.phases.applicationSubmission.status = 'failed';
      results.phases.applicationSubmission.error = error.message;
      throw error;
    }
  }

  // Utility methods
  generateTaskId() {
    return `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateJobId(job) {
    const hash = btoa(`${job.title}_${job.company}_${job.platform}`).replace(/[^a-zA-Z0-9]/g, '');
    return `job_${hash.substr(0, 12)}`;
  }

  deduplicateJobs(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  calculateFitScore(job, profile) {
    // Simplified fit score calculation
    let score = 50; // Base score
    
    const jobTitle = job.title.toLowerCase();
    const profileSkills = (profile.keySkills || '').toLowerCase();
    const profileRoles = (profile.jobRoles || '').toLowerCase();
    
    // Check for skill matches
    const skills = profileSkills.split(',').map(s => s.trim());
    for (const skill of skills) {
      if (skill && jobTitle.includes(skill)) {
        score += 10;
      }
    }
    
    // Check for role matches
    const roles = profileRoles.split(',').map(r => r.trim());
    for (const role of roles) {
      if (role && jobTitle.includes(role)) {
        score += 15;
      }
    }
    
    // Location preference
    if (job.location && job.location.toLowerCase().includes('remote')) {
      score += 10;
    }
    
    // Platform preference (StepStone tends to have higher quality jobs)
    if (job.platform === 'stepstone.de') {
      score += 5;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  async generateCoverLetter(job, profile) {
    // Simplified cover letter generation
    // In a real implementation, this would call the AI service
    
    const template = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With ${profile.yearsOfExperience || 'several'} years of experience in ${profile.keySkills || 'relevant technologies'}, I am confident that I would be a valuable addition to your team.

${profile.summary || 'I bring a passion for technology and a proven track record of delivering high-quality solutions.'}

I am particularly excited about this opportunity because it aligns perfectly with my career goals and expertise. I would welcome the chance to discuss how my skills and experience can contribute to ${job.company}'s continued success.

Thank you for considering my application. I look forward to hearing from you.

Best regards,
${profile.name || 'Applicant'}`;

    return template;
  }

  getApplicationRecommendation(fitScore, applicationInfo) {
    if (fitScore >= 80) {
      return 'apply';
    } else if (fitScore >= 60) {
      return 'review';
    } else {
      return 'skip';
    }
  }

  // Task management
  async getTaskStatus(taskId) {
    return this.currentTasks.get(taskId) || null;
  }

  async cancelTask(taskId) {
    if (this.currentTasks.has(taskId)) {
      this.currentTasks.delete(taskId);
      return true;
    }
    return false;
  }

  // Test automation
  async testAutomation() {
    try {
      console.log('Testing Browserless.io connection...');
      const result = await browserlessService.testAutomation();
      
      return {
        success: result.success,
        message: result.success ? 'Browserless.io connection successful' : 'Connection failed',
        details: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Automation test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new AutomationService();

