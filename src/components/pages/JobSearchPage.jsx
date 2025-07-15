import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  Star, 
  TrendingUp,
  Filter,
  Zap,
  Eye,
  Heart,
  ExternalLink,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import config from '@/config/environment';

const JobSearchPage = ({ profile, agentMode, addAgentMessage, onExecuteCommand }) => {
  const [searchParams, setSearchParams] = useState({
    keywords: '',
    location: 'Germany',
    jobType: 'all',
    experience: 'all',
    remote: false,
    salary: ''
  });
  
  const [jobs, setJobs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [fitScores, setFitScores] = useState({});
  const [autoSearchEnabled, setAutoSearchEnabled] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(null);

  // German job boards configuration
  const jobBoards = [
    { name: 'StepStone.de', url: 'stepstone.de', active: true, priority: 1 },
    { name: 'Indeed.de', url: 'indeed.de', active: true, priority: 2 },
    { name: 'Xing.com', url: 'xing.com', active: true, priority: 3 },
    { name: 'LinkedIn.de', url: 'linkedin.com', active: true, priority: 4 },
    { name: 'Monster.de', url: 'monster.de', active: false, priority: 5 }
  ];

  // Mock job data for demonstration (will be replaced with real search)
  const mockJobs = [
    {
      id: 1,
      title: 'Senior Python Developer',
      company: 'TechCorp GmbH',
      location: 'Berlin, Germany',
      type: 'Full-time',
      remote: true,
      salary: '€70,000 - €90,000',
      posted: '2 days ago',
      source: 'StepStone.de',
      description: 'We are looking for a Senior Python Developer to join our growing team...',
      requirements: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'],
      fitScore: 92,
      fitReasons: ['Strong Python experience match', 'Location preference aligned', 'Salary within range'],
      easyApply: true,
      url: 'https://stepstone.de/job/123'
    },
    {
      id: 2,
      title: 'DevOps Engineer',
      company: 'StartupX',
      location: 'Munich, Germany',
      type: 'Full-time',
      remote: false,
      salary: '€65,000 - €85,000',
      posted: '1 day ago',
      source: 'Indeed.de',
      description: 'Join our DevOps team and help scale our infrastructure...',
      requirements: ['Kubernetes', 'AWS', 'Terraform', 'Python', 'CI/CD'],
      fitScore: 78,
      fitReasons: ['Good technical skills match', 'Experience level appropriate'],
      easyApply: false,
      url: 'https://indeed.de/job/456'
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'Digital Agency Berlin',
      location: 'Berlin, Germany',
      type: 'Contract',
      remote: true,
      salary: '€500/day',
      posted: '3 hours ago',
      source: 'Xing.com',
      description: 'We need a Full Stack Developer for a 6-month project...',
      requirements: ['React', 'Node.js', 'Python', 'MongoDB', 'TypeScript'],
      fitScore: 85,
      fitReasons: ['Excellent skill alignment', 'Remote work available', 'High daily rate'],
      easyApply: true,
      url: 'https://xing.com/job/789'
    }
  ];

  // Calculate fit score based on profile and job requirements
  const calculateFitScore = useCallback((job, userProfile) => {
    if (!userProfile || !job.requirements) return 0;
    
    const userSkills = (userProfile.keySkills || '').toLowerCase().split(',').map(s => s.trim());
    const jobRequirements = job.requirements.map(r => r.toLowerCase());
    
    const matchingSkills = jobRequirements.filter(req => 
      userSkills.some(skill => skill.includes(req) || req.includes(skill))
    );
    
    const skillMatch = (matchingSkills.length / jobRequirements.length) * 60;
    const locationMatch = job.location.toLowerCase().includes((userProfile.locations || 'germany').toLowerCase()) ? 20 : 0;
    const experienceMatch = 20; // Simplified for demo
    
    return Math.min(100, Math.round(skillMatch + locationMatch + experienceMatch));
  }, []);

  // Perform job search
  const performSearch = useCallback(async (params = searchParams, isAutoSearch = false) => {
    setIsSearching(true);
    setLastSearchTime(new Date());
    
    if (!isAutoSearch) {
      addAgentMessage(`Searching for ${params.keywords || 'all'} jobs in ${params.location}...`);
    }

    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate the search with mock data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Filter mock jobs based on search params
      let filteredJobs = mockJobs;
      
      if (params.keywords) {
        filteredJobs = filteredJobs.filter(job => 
          job.title.toLowerCase().includes(params.keywords.toLowerCase()) ||
          job.requirements.some(req => req.toLowerCase().includes(params.keywords.toLowerCase()))
        );
      }
      
      if (params.remote) {
        filteredJobs = filteredJobs.filter(job => job.remote);
      }
      
      // Calculate fit scores for each job
      const jobsWithScores = filteredJobs.map(job => ({
        ...job,
        fitScore: calculateFitScore(job, profile)
      }));
      
      // Sort by fit score
      jobsWithScores.sort((a, b) => b.fitScore - a.fitScore);
      
      setJobs(jobsWithScores);
      setSearchResults({
        total: jobsWithScores.length,
        searchTime: Date.now(),
        params: params,
        sources: jobBoards.filter(board => board.active)
      });
      
      if (!isAutoSearch) {
        addAgentMessage(`Found ${jobsWithScores.length} jobs! ${jobsWithScores.filter(j => j.fitScore >= 80).length} are high-fit matches (80%+ score).`);
      }
      
    } catch (error) {
      console.error('Job search failed:', error);
      addAgentMessage("Job search failed. Please try again or adjust your search criteria.");
    } finally {
      setIsSearching(false);
    }
  }, [searchParams, profile, calculateFitScore, addAgentMessage]);

  // Handle search parameter changes
  const handleSearchParamChange = useCallback((field, value) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle manual search
  const handleSearch = useCallback(() => {
    performSearch();
  }, [performSearch]);

  // Handle AI command execution
  useEffect(() => {
    if (onExecuteCommand) {
      onExecuteCommand('search_jobs', performSearch);
    }
  }, [onExecuteCommand, performSearch]);

  // Auto-search when enabled and profile changes
  useEffect(() => {
    if (autoSearchEnabled && profile?.keySkills && agentMode === 'autonomous') {
      const autoSearchParams = {
        ...searchParams,
        keywords: profile.jobRoles || profile.keySkills?.split(',')[0] || ''
      };
      performSearch(autoSearchParams, true);
    }
  }, [autoSearchEnabled, profile, agentMode, performSearch]);

  // Get fit score color
  const getFitScoreColor = (score) => {
    if (score >= 80) return 'fit-score-high';
    if (score >= 60) return 'fit-score-medium';
    return 'fit-score-low';
  };

  // Format time ago
  const formatTimeAgo = (timeString) => {
    // Simple implementation for demo
    return timeString;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="heading-xl gradient-text mb-4">
            Strategic Opportunity Funnel
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            AI-powered job discovery from German job boards with intelligent fit scoring and autonomous application capabilities
          </p>
        </div>

        {/* Search Controls */}
        <Card className="glass card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Intelligent Job Search</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={agentMode === 'autonomous' ? 'status-active' : 'status-pending'}>
                  {agentMode === 'autonomous' ? 'Autonomous Mode' : 'Review Mode'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoSearchEnabled(!autoSearchEnabled)}
                  className={autoSearchEnabled ? 'btn-autonomous' : ''}
                >
                  {autoSearchEnabled ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                  Auto-Search
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={searchParams.keywords}
                  onChange={(e) => handleSearchParamChange('keywords', e.target.value)}
                  placeholder="e.g., Python, DevOps, React"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={searchParams.location} onValueChange={(value) => handleSearchParamChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Berlin">Berlin</SelectItem>
                    <SelectItem value="Munich">Munich</SelectItem>
                    <SelectItem value="Hamburg">Hamburg</SelectItem>
                    <SelectItem value="Frankfurt">Frankfurt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={searchParams.jobType} onValueChange={(value) => handleSearchParamChange('jobType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="remote">Remote Work</Label>
                <Select value={searchParams.remote ? 'yes' : 'no'} onValueChange={(value) => handleSearchParamChange('remote', value === 'yes')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No Preference</SelectItem>
                    <SelectItem value="yes">Remote Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="btn-ai"
                size="lg"
              >
                {isSearching ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Jobs
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results Summary */}
        {searchResults && (
          <Card className="glass">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{searchResults.total}</p>
                  <p className="text-sm text-muted-foreground">Jobs Found</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-2">{jobs.filter(j => j.fitScore >= 80).length}</p>
                  <p className="text-sm text-muted-foreground">High-Fit Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-3">{jobs.filter(j => j.easyApply).length}</p>
                  <p className="text-sm text-muted-foreground">Easy Apply</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-4">{searchResults.sources.length}</p>
                  <p className="text-sm text-muted-foreground">Job Boards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Listings */}
        <div className="space-y-6">
          {isSearching ? (
            <Card className="glass">
              <CardContent className="py-12">
                <LoadingSpinner 
                  size="lg" 
                  message="Searching German job boards... Analyzing fit scores and application complexity..."
                  aiMode 
                />
              </CardContent>
            </Card>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <Card key={job.id} className="glass card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge className={`${getFitScoreColor(job.fitScore)} font-medium`}>
                          {job.fitScore}% Fit
                        </Badge>
                        {job.easyApply && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <Zap className="h-3 w-3 mr-1" />
                            Easy Apply
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.posted}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.slice(0, 5).map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                        {job.requirements.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.requirements.length - 5} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-primary">{job.salary}</span>
                          <Badge variant="outline">{job.type}</Badge>
                          {job.remote && <Badge className="bg-blue-500/20 text-blue-400">Remote</Badge>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Heart className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button 
                            className={job.easyApply ? 'btn-autonomous' : 'btn-ai'}
                            size="sm"
                          >
                            {job.easyApply ? (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                Quick Apply
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Apply
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fit Score Details */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">AI Fit Analysis</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Match Score</p>
                        <Progress value={job.fitScore} className="h-2" />
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">Key Reasons</p>
                        <div className="flex flex-wrap gap-1">
                          {job.fitReasons.map((reason, index) => (
                            <Badge key={index} className="text-xs bg-primary/10 text-primary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : searchResults && (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or keywords
                </p>
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job Boards Status */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Job Board Coverage</span>
            </CardTitle>
            <CardDescription>
              Real-time status of German job board integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobBoards.map((board) => (
                <div key={board.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${board.active ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{board.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Priority {board.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobSearchPage;

