import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap,
  Brain,
  Eye,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Award,
  Lightbulb,
  Activity,
  PieChart,
  LineChart,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TestTube,
  Beaker,
  FlaskConical,
  Microscope,
  Database,
  Cpu,
  Gauge
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const AnalyticsPage = ({ 
  applications = [], 
  jobs = [], 
  profile = {}, 
  agentMode = 'review',
  onUpdateAnalytics 
}) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [experiments, setExperiments] = useState([
    {
      id: 1,
      name: 'Cover Letter A/B Test',
      type: 'cover_letter',
      status: 'running',
      startDate: '2024-01-15',
      variants: ['Professional Tone', 'Conversational Tone'],
      metrics: {
        variant_a: { applications: 12, responses: 4, interviews: 2 },
        variant_b: { applications: 15, responses: 7, interviews: 3 }
      },
      confidence: 78,
      winner: 'variant_b'
    },
    {
      id: 2,
      name: 'Application Timing Test',
      type: 'timing',
      status: 'completed',
      startDate: '2024-01-10',
      variants: ['Morning (9-11 AM)', 'Afternoon (2-4 PM)'],
      metrics: {
        variant_a: { applications: 20, responses: 6, interviews: 2 },
        variant_b: { applications: 18, responses: 8, interviews: 4 }
      },
      confidence: 92,
      winner: 'variant_b'
    },
    {
      id: 3,
      name: 'Job Board Optimization',
      type: 'platform',
      status: 'draft',
      startDate: '2024-01-20',
      variants: ['StepStone Focus', 'Multi-Platform'],
      metrics: {
        variant_a: { applications: 0, responses: 0, interviews: 0 },
        variant_b: { applications: 0, responses: 0, interviews: 0 }
      },
      confidence: 0,
      winner: null
    }
  ]);

  // Calculate analytics metrics
  const analytics = {
    totalApplications: applications.length || 24,
    responseRate: applications.length > 0 ? (applications.filter(app => app.status === 'interviewing' || app.status === 'responded').length / applications.length * 100) : 32,
    interviewRate: applications.length > 0 ? (applications.filter(app => app.status === 'interviewing').length / applications.length * 100) : 18,
    averageResponseTime: 4.2,
    topPerformingPlatforms: [
      { name: 'StepStone.de', applications: 8, responses: 3, rate: 37.5 },
      { name: 'Indeed.de', applications: 6, responses: 2, rate: 33.3 },
      { name: 'LinkedIn.de', applications: 5, responses: 2, rate: 40.0 },
      { name: 'Xing.com', applications: 5, responses: 1, rate: 20.0 }
    ],
    skillsPerformance: [
      { skill: 'Python', applications: 12, interviews: 4, rate: 33.3 },
      { skill: 'React', applications: 8, interviews: 3, rate: 37.5 },
      { skill: 'Node.js', applications: 6, interviews: 2, rate: 33.3 },
      { skill: 'Machine Learning', applications: 4, interviews: 2, rate: 50.0 }
    ],
    weeklyTrends: [
      { week: 'Week 1', applications: 6, responses: 2, interviews: 1 },
      { week: 'Week 2', applications: 8, responses: 3, interviews: 1 },
      { week: 'Week 3', applications: 5, responses: 1, interviews: 2 },
      { week: 'Week 4', applications: 5, responses: 2, interviews: 1 }
    ]
  };

  const handleStartExperiment = (experimentId) => {
    setExperiments(prev => prev.map(exp => 
      exp.id === experimentId 
        ? { ...exp, status: 'running', startDate: new Date().toISOString().split('T')[0] }
        : exp
    ));
  };

  const handleStopExperiment = (experimentId) => {
    setExperiments(prev => prev.map(exp => 
      exp.id === experimentId 
        ? { ...exp, status: 'completed' }
        : exp
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <Play className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'draft': return <Pause className="h-3 w-3" />;
      default: return <Pause className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Adaptive Intelligence Core
          </h1>
          <p className="text-muted-foreground mt-2">
            Performance analytics, A/B testing, and continuous learning optimization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="experiments">A/B Experiments</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Performance Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Target className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalApplications}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1 text-green-400" />
                  +12% from last period
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <Activity className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.responseRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1 text-green-400" />
                  +5.2% from last period
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.interviewRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1 text-green-400" />
                  +2.1% from last period
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageResponseTime} days</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1 text-green-400" />
                  -0.8 days improvement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Performance */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                Platform Performance
              </CardTitle>
              <CardDescription>
                Response rates across different job platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topPerformingPlatforms.map((platform, index) => (
                  <div key={platform.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="font-medium">{platform.name}</span>
                      <Badge variant="outline">{platform.applications} apps</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{platform.rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{platform.responses} responses</div>
                      </div>
                      <Progress value={platform.rate} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills Performance */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-400" />
                Skills Performance
              </CardTitle>
              <CardDescription>
                Interview rates by skill category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.skillsPerformance.map((skill, index) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span className="font-medium">{skill.skill}</span>
                      <Badge variant="outline">{skill.applications} apps</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{skill.rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{skill.interviews} interviews</div>
                      </div>
                      <Progress value={skill.rate} className="w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Experiments Tab */}
        <TabsContent value="experiments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Active Experiments</h2>
              <p className="text-muted-foreground">Continuous optimization through A/B testing</p>
            </div>
            <Button>
              <TestTube className="h-4 w-4 mr-2" />
              New Experiment
            </Button>
          </div>

          <div className="grid gap-6">
            {experiments.map((experiment) => (
              <Card key={experiment.id} className="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(experiment.status)}`}></div>
                      <CardTitle className="text-lg">{experiment.name}</CardTitle>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getStatusIcon(experiment.status)}
                        <span className="capitalize">{experiment.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {experiment.status === 'draft' && (
                        <Button size="sm" onClick={() => handleStartExperiment(experiment.id)}>
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {experiment.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => handleStopExperiment(experiment.id)}>
                          <Pause className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Started {experiment.startDate} • Testing {experiment.variants.join(' vs ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Variant A */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-400">Variant A: {experiment.variants[0]}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Applications</span>
                          <span className="font-medium">{experiment.metrics.variant_a.applications}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Responses</span>
                          <span className="font-medium">{experiment.metrics.variant_a.responses}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Interviews</span>
                          <span className="font-medium">{experiment.metrics.variant_a.interviews}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Rate</span>
                          <span className="text-blue-400">
                            {experiment.metrics.variant_a.applications > 0 
                              ? ((experiment.metrics.variant_a.responses / experiment.metrics.variant_a.applications) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-400">Variant B: {experiment.variants[1]}</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Applications</span>
                          <span className="font-medium">{experiment.metrics.variant_b.applications}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Responses</span>
                          <span className="font-medium">{experiment.metrics.variant_b.responses}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Interviews</span>
                          <span className="font-medium">{experiment.metrics.variant_b.interviews}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Rate</span>
                          <span className="text-green-400">
                            {experiment.metrics.variant_b.applications > 0 
                              ? ((experiment.metrics.variant_b.responses / experiment.metrics.variant_b.applications) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Results</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Confidence</span>
                          <span className="font-medium">{experiment.confidence}%</span>
                        </div>
                        <Progress value={experiment.confidence} className="h-2" />
                        {experiment.winner && (
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span>Winner: Variant {experiment.winner === 'variant_a' ? 'A' : 'B'}</span>
                          </div>
                        )}
                        {experiment.status === 'running' && experiment.confidence < 95 && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Need more data</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-400" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Intelligent recommendations based on your performance data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400">Timing Optimization</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your applications sent between 2-4 PM have a 40% higher response rate. 
                      Consider scheduling more applications during this window.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-400">Platform Performance</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      LinkedIn.de shows the highest response rate (40%) for your profile. 
                      Increase focus on this platform for better results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Award className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-400">Skills Highlight</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Machine Learning positions have a 50% interview rate. 
                      Consider emphasizing ML skills more prominently in applications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-400">Cover Letter Optimization</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Conversational tone cover letters are performing 23% better. 
                      The A/B test suggests updating your default template.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2 text-green-400" />
                  Performance Optimization
                </CardTitle>
                <CardDescription>
                  Automated improvements and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically apply winning A/B test results
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Smart Scheduling</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimize application timing based on response patterns
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Platform Prioritization</h4>
                      <p className="text-sm text-muted-foreground">
                        Focus on highest-performing job platforms
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Content Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Continuously improve cover letters and applications
                      </p>
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      Learning
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Optimization Impact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-green-500/10">
                      <div className="text-2xl font-bold text-green-400">+23%</div>
                      <div className="text-sm text-muted-foreground">Response Rate</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-500/10">
                      <div className="text-2xl font-bold text-blue-400">+15%</div>
                      <div className="text-sm text-muted-foreground">Interview Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;

