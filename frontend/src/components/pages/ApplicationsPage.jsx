import React, { useState, useCallback, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Calendar,
  Zap,
  Brain,
  Play,
  Pause,
  Settings,
  FileText,
  ExternalLink,
  Target,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Download,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Progress } from '../ui/progress.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Switch } from '../ui/switch.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import AutomationPanel from '../automation/AutomationPanel.jsx';
import config from '../../config/environment.js';

const ApplicationsPage = ({ 
  profile, 
  agentMode, 
  addAgentMessage, 
  onExecuteCommand,
  applications = [],
  setApplications 
}) => {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [applicationQueue, setApplicationQueue] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    interviewing: 0,
    rejected: 0,
    successRate: 0
  });

  // Mock application data for demonstration
  const mockApplications = [
    {
      id: 1,
      jobTitle: 'Senior Python Developer',
      company: 'TechCorp GmbH',
      location: 'Berlin, Germany',
      appliedAt: new Date('2024-01-10'),
      status: 'interviewing',
      applicationMethod: 'easy_apply',
      fitScore: 92,
      source: 'StepStone.de',
      salary: '€70,000 - €90,000',
      coverLetter: 'AI-generated personalized cover letter...',
      notes: 'Technical interview scheduled for next week',
      nextAction: 'Prepare for technical interview',
      nextActionDate: new Date('2024-01-15'),
      responseTime: '2 days',
      automatedSteps: ['Application submitted', 'Follow-up email sent', 'Interview scheduled'],
      jobUrl: 'https://stepstone.de/job/123'
    },
    {
      id: 2,
      jobTitle: 'DevOps Engineer',
      company: 'StartupX',
      location: 'Munich, Germany',
      appliedAt: new Date('2024-01-08'),
      status: 'submitted',
      applicationMethod: 'complex_apply',
      fitScore: 78,
      source: 'Indeed.de',
      salary: '€65,000 - €85,000',
      coverLetter: 'AI-generated personalized cover letter...',
      notes: 'Waiting for response',
      nextAction: 'Follow-up email',
      nextActionDate: new Date('2024-01-16'),
      responseTime: 'Pending',
      automatedSteps: ['Application submitted', 'Follow-up scheduled'],
      jobUrl: 'https://indeed.de/job/456'
    },
    {
      id: 3,
      jobTitle: 'Full Stack Developer',
      company: 'Digital Agency Berlin',
      location: 'Berlin, Germany',
      appliedAt: new Date('2024-01-12'),
      status: 'pending',
      applicationMethod: 'easy_apply',
      fitScore: 85,
      source: 'Xing.com',
      salary: '€500/day',
      coverLetter: 'AI-generated personalized cover letter...',
      notes: 'Application in queue for autonomous submission',
      nextAction: 'Submit application',
      nextActionDate: new Date('2024-01-13'),
      responseTime: 'N/A',
      automatedSteps: ['Application prepared', 'Waiting for approval'],
      jobUrl: 'https://xing.com/job/789'
    },
    {
      id: 4,
      jobTitle: 'Software Architect',
      company: 'Enterprise Solutions GmbH',
      location: 'Frankfurt, Germany',
      appliedAt: new Date('2024-01-05'),
      status: 'rejected',
      applicationMethod: 'complex_apply',
      fitScore: 88,
      source: 'LinkedIn.de',
      salary: '€90,000 - €110,000',
      coverLetter: 'AI-generated personalized cover letter...',
      notes: 'Position filled internally',
      nextAction: 'Learn from feedback',
      nextActionDate: null,
      responseTime: '5 days',
      automatedSteps: ['Application submitted', 'Follow-up sent', 'Rejection received'],
      jobUrl: 'https://linkedin.com/job/101'
    }
  ];

  // Initialize applications and stats
  useEffect(() => {
    if (applications.length === 0) {
      setApplications(mockApplications);
    }
    
    // Calculate stats
    const stats = {
      total: mockApplications.length,
      pending: mockApplications.filter(app => app.status === 'pending').length,
      submitted: mockApplications.filter(app => app.status === 'submitted').length,
      interviewing: mockApplications.filter(app => app.status === 'interviewing').length,
      rejected: mockApplications.filter(app => app.status === 'rejected').length,
      successRate: Math.round((mockApplications.filter(app => app.status === 'interviewing').length / mockApplications.length) * 100)
    };
    setApplicationStats(stats);
  }, [applications, setApplications]);

  // Filter applications
  const filteredApplications = mockApplications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, label: 'Pending' },
      submitted: { color: 'bg-blue-500/20 text-blue-400', icon: Send, label: 'Submitted' },
      interviewing: { color: 'bg-green-500/20 text-green-400', icon: Calendar, label: 'Interviewing' },
      rejected: { color: 'bg-red-500/20 text-red-400', icon: AlertCircle, label: 'Rejected' }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Handle autonomous application submission
  const handleAutonomousApplication = useCallback(async (jobData) => {
    setIsApplying(true);
    addAgentMessage(`Starting autonomous application for ${jobData.title} at ${jobData.company}...`);

    try {
      // Simulate application process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Create new application
      const newApplication = {
        id: Date.now(),
        jobTitle: jobData.title,
        company: jobData.company,
        location: jobData.location,
        appliedAt: new Date(),
        status: jobData.easyApply ? 'submitted' : 'pending',
        applicationMethod: jobData.easyApply ? 'easy_apply' : 'complex_apply',
        fitScore: jobData.fitScore,
        source: jobData.source,
        salary: jobData.salary,
        coverLetter: 'AI-generated personalized cover letter based on job requirements and your profile...',
        notes: jobData.easyApply ? 'Successfully submitted via Easy Apply' : 'Complex application prepared, awaiting manual review',
        nextAction: jobData.easyApply ? 'Follow-up email' : 'Complete manual application',
        nextActionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        responseTime: 'N/A',
        automatedSteps: jobData.easyApply ? 
          ['Profile matched', 'Cover letter generated', 'Application submitted', 'Follow-up scheduled'] :
          ['Profile matched', 'Cover letter generated', 'Application prepared'],
        jobUrl: jobData.url
      };

      setApplications(prev => [newApplication, ...prev]);
      addAgentMessage(`${jobData.easyApply ? 'Successfully applied' : 'Application prepared'} for ${jobData.title}!`);

    } catch (error) {
      console.error('Application failed:', error);
      addAgentMessage(`Application failed for ${jobData.title}. Please try again.`);
    } finally {
      setIsApplying(false);
    }
  }, [addAgentMessage, setApplications]);

  // Handle application action
  const handleApplicationAction = useCallback((action, applicationId) => {
    const application = mockApplications.find(app => app.id === applicationId);
    if (!application) return;

    switch (action) {
      case 'view':
        setSelectedApplication(application);
        break;
      case 'approve':
        // Approve pending application
        addAgentMessage(`Approving application for ${application.jobTitle} at ${application.company}...`);
        break;
      case 'reject':
        // Reject pending application
        addAgentMessage(`Rejecting application for ${application.jobTitle} at ${application.company}.`);
        break;
      case 'follow_up':
        // Send follow-up
        addAgentMessage(`Sending follow-up email for ${application.jobTitle} application...`);
        break;
      default:
        break;
    }
  }, [addAgentMessage]);

  // Register command handlers for AI Assistant
  useEffect(() => {
    if (onExecuteCommand) {
      onExecuteCommand('apply_to_job', handleAutonomousApplication);
      onExecuteCommand('check_application_status', (params) => {
        const { company } = params;
        const app = mockApplications.find(a => 
          a.company.toLowerCase().includes(company.toLowerCase())
        );
        if (app) {
          addAgentMessage(`Application status for ${app.company}: ${app.status}. ${app.notes}`);
        } else {
          addAgentMessage(`No application found for ${company}.`);
        }
      });
    }
  }, [onExecuteCommand, handleAutonomousApplication, addAgentMessage]);

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="heading-xl gradient-text mb-4">
            Application Pipeline
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Zero-friction application system with autonomous submission and intelligent tracking
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">{applicationStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-yellow-400">{applicationStats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-blue-400">{applicationStats.submitted}</p>
              <p className="text-sm text-muted-foreground">Submitted</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-400">{applicationStats.interviewing}</p>
              <p className="text-sm text-muted-foreground">Interviewing</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-chart-2">{applicationStats.successRate}%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>Autonomous Application Engine</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={autoApplyEnabled}
                    onCheckedChange={setAutoApplyEnabled}
                  />
                  <Label className="text-sm">Auto-Apply</Label>
                </div>
                <Badge className={agentMode === 'autonomous' ? 'status-active' : 'status-pending'}>
                  {agentMode === 'autonomous' ? 'Autonomous Mode' : 'Review Mode'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Applications</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by job title or company..."
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Queue (for pending applications) */}
        {applicationStats.pending > 0 && (
          <Card className="glass border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-400">
                <Clock className="h-5 w-5" />
                <span>Application Queue</span>
                <Badge className="bg-yellow-500/20 text-yellow-400">
                  {applicationStats.pending} Pending
                </Badge>
              </CardTitle>
              <CardDescription>
                Applications waiting for {agentMode === 'autonomous' ? 'autonomous submission' : 'your approval'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredApplications.filter(app => app.status === 'pending').map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{app.jobTitle}</h4>
                      <p className="text-sm text-muted-foreground">{app.company} • {app.location}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className="bg-primary/20 text-primary text-xs">
                          {app.fitScore}% Fit
                        </Badge>
                        <Badge className={app.applicationMethod === 'easy_apply' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'} variant="outline">
                          {app.applicationMethod === 'easy_apply' ? 'Easy Apply' : 'Complex Apply'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApplicationAction('view', app.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                      <Button 
                        className="btn-autonomous"
                        size="sm"
                        onClick={() => handleApplicationAction('approve', app.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        <div className="space-y-6">
          {isApplying && (
            <Card className="glass border-primary/20">
              <CardContent className="py-8">
                <LoadingSpinner 
                  size="lg" 
                  message="Submitting application... Generating personalized cover letter and optimizing for ATS..."
                  aiMode 
                />
              </CardContent>
            </Card>
          )}

          {filteredApplications.map((application) => {
            const statusInfo = getStatusInfo(application.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={application.id} className="glass card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{application.jobTitle}</h3>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge className="bg-primary/20 text-primary">
                          {application.fitScore}% Fit
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-muted-foreground mb-3">
                        <span>{application.company}</span>
                        <span>•</span>
                        <span>{application.location}</span>
                        <span>•</span>
                        <span>Applied {formatTimeAgo(application.appliedAt)}</span>
                        <span>•</span>
                        <span className="text-primary">{application.salary}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <Badge variant="outline" className="text-xs">
                          {application.source}
                        </Badge>
                        <Badge className={application.applicationMethod === 'easy_apply' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}>
                          <Zap className="h-3 w-3 mr-1" />
                          {application.applicationMethod === 'easy_apply' ? 'Easy Apply' : 'Complex Apply'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Response: {application.responseTime}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{application.notes}</p>
                      
                      {/* Automated Steps */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Automated Steps:</p>
                        <div className="flex flex-wrap gap-2">
                          {application.automatedSteps.map((step, index) => (
                            <Badge key={index} className="text-xs bg-muted/20 text-muted-foreground">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {step}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Next Action */}
                      {application.nextAction && (
                        <div className="flex items-center space-x-2 mb-4">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Next Action:</span>
                          <span className="text-sm text-muted-foreground">{application.nextAction}</span>
                          {application.nextActionDate && (
                            <Badge variant="outline" className="text-xs">
                              {formatDate(application.nextActionDate)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApplicationAction('view', application.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Job Posting
                      </Button>
                      {application.status === 'submitted' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApplicationAction('follow_up', application.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Follow Up
                        </Button>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredApplications.length === 0 && (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start applying to jobs to see them here'
                }
              </p>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Find Jobs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Automation Panel */}
      <div className="mt-8">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" />
              Autonomous Application Engine
            </CardTitle>
            <CardDescription>
              Configure and control automated job applications using Browserless.io
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationPanel 
              profile={profile}
              onAutomationStart={() => {
                addAgentMessage('🤖 Starting autonomous application process...');
                setIsApplying(true);
              }}
              onAutomationComplete={(results) => {
                addAgentMessage(`✅ Automation completed! Applied to ${results.summary?.applicationsSuccessful || 0} jobs out of ${results.summary?.applicationsAttempted || 0} attempts.`);
                setIsApplying(false);
                
                // Update applications list with new applications
                if (results.phases?.applicationSubmission?.results) {
                  const newApplications = results.phases.applicationSubmission.results.map(result => ({
                    id: Date.now() + Math.random(),
                    jobTitle: result.jobTitle,
                    company: result.company,
                    location: 'Germany',
                    appliedAt: new Date(result.submittedAt),
                    status: result.success ? 'submitted' : 'failed',
                    applicationMethod: result.applicationMethod.toLowerCase().replace(' ', '_'),
                    fitScore: 85, // Would be calculated from automation results
                    source: 'Automated',
                    salary: 'TBD',
                    coverLetter: 'AI-generated personalized cover letter',
                    notes: result.success ? 'Successfully submitted via automation' : `Failed: ${result.error}`,
                    nextAction: result.success ? 'Wait for response' : 'Review and retry',
                    nextActionDate: result.success ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
                    responseTime: 'N/A',
                    automatedSteps: result.steps || [],
                    jobUrl: '#'
                  }));
                  
                  setApplications(prev => [...newApplications, ...prev]);
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationsPage;

