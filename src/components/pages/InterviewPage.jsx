import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MessageSquare,
  Brain,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  FileText,
  Users,
  Building,
  Calendar,
  Award,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Volume2,
  VolumeX,
  Camera,
  Monitor,
  Headphones,
  BookOpen,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Upload,
  Search,
  ExternalLink,
  Send
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

const InterviewPage = ({ 
  profile, 
  agentMode, 
  addAgentMessage, 
  onExecuteCommand,
  applications = []
}) => {
  const [activeTab, setActiveTab] = useState('preparation');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewerProfile, setInterviewerProfile] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isMockInterview, setIsMockInterview] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [interviewFeedback, setInterviewFeedback] = useState(null);
  const [companyResearch, setCompanyResearch] = useState(null);
  const [isResearching, setIsResearching] = useState(false);

  // Mock applications for demo
  const mockApplications = [
    {
      id: 1,
      jobTitle: 'Senior React Developer',
      company: 'TechCorp Berlin',
      location: 'Berlin, Germany',
      status: 'interviewing',
      interviewDate: new Date('2024-01-20'),
      interviewType: 'Technical Interview',
      fitScore: 92
    },
    {
      id: 2,
      jobTitle: 'Full Stack Engineer',
      company: 'StartupHub Munich',
      location: 'Munich, Germany', 
      status: 'interviewing',
      interviewDate: new Date('2024-01-22'),
      interviewType: 'Cultural Fit Interview',
      fitScore: 88
    }
  ];

  const interviewingApplications = applications.length > 0 
    ? applications.filter(app => app.status === 'interviewing')
    : mockApplications;

  // Generate interview questions based on job and profile
  const generateInterviewQuestions = async (application) => {
    setIsGeneratingQuestions(true);
    
    try {
      // Simulate AI question generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const questions = [
        {
          id: 1,
          category: 'Technical',
          question: `Can you walk me through your experience with React and how you've used it in previous projects?`,
          difficulty: 'Medium',
          expectedDuration: '5-7 minutes',
          tips: 'Focus on specific projects, mention hooks, state management, and performance optimization.',
          followUp: 'What challenges did you face and how did you overcome them?'
        },
        {
          id: 2,
          category: 'Behavioral',
          question: `Tell me about a time when you had to work with a difficult team member. How did you handle the situation?`,
          difficulty: 'Medium',
          expectedDuration: '3-5 minutes',
          tips: 'Use the STAR method (Situation, Task, Action, Result). Show emotional intelligence.',
          followUp: 'What would you do differently if faced with a similar situation?'
        },
        {
          id: 3,
          category: 'Company-Specific',
          question: `Why do you want to work at ${application.company} specifically?`,
          difficulty: 'Easy',
          expectedDuration: '2-3 minutes',
          tips: 'Research the company values, recent news, and products. Show genuine interest.',
          followUp: 'How do you see yourself contributing to our team?'
        },
        {
          id: 4,
          category: 'Technical',
          question: `How would you approach optimizing the performance of a React application?`,
          difficulty: 'Hard',
          expectedDuration: '7-10 minutes',
          tips: 'Mention React.memo, useMemo, useCallback, code splitting, lazy loading.',
          followUp: 'Can you give an example of when you implemented these optimizations?'
        },
        {
          id: 5,
          category: 'Problem-Solving',
          question: `If you had to design a system to handle 1 million users, what would be your approach?`,
          difficulty: 'Hard',
          expectedDuration: '10-15 minutes',
          tips: 'Think about scalability, load balancing, caching, database optimization.',
          followUp: 'How would you monitor and maintain such a system?'
        }
      ];
      
      setGeneratedQuestions(questions);
      addAgentMessage(`✅ Generated ${questions.length} personalized interview questions for ${application.company}`);
      
    } catch (error) {
      console.error('Error generating questions:', error);
      addAgentMessage('❌ Failed to generate interview questions. Please try again.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Research company information
  const researchCompany = async (companyName) => {
    setIsResearching(true);
    
    try {
      // Simulate company research
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const research = {
        company: companyName,
        overview: `${companyName} is a leading technology company specializing in innovative software solutions. Founded in 2015, they have grown to over 500 employees across Europe.`,
        values: ['Innovation', 'Collaboration', 'Customer Focus', 'Sustainability'],
        recentNews: [
          'Raised €50M Series C funding',
          'Launched new AI-powered product line',
          'Expanded to 3 new European markets'
        ],
        culture: 'Fast-paced, collaborative environment with focus on work-life balance and professional development.',
        techStack: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes'],
        benefits: ['Remote work options', 'Learning budget', 'Health insurance', 'Stock options'],
        interviewProcess: '1. Phone screening → 2. Technical interview → 3. Cultural fit → 4. Final round'
      };
      
      setCompanyResearch(research);
      addAgentMessage(`🔍 Completed research on ${companyName}. Key insights added to preparation materials.`);
      
    } catch (error) {
      console.error('Error researching company:', error);
      addAgentMessage('❌ Failed to research company. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  // Start mock interview
  const startMockInterview = () => {
    if (generatedQuestions.length === 0) {
      addAgentMessage('⚠️ Please generate interview questions first.');
      return;
    }
    
    setIsMockInterview(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    addAgentMessage('🎯 Starting mock interview session. Good luck!');
  };

  // End mock interview and provide feedback
  const endMockInterview = () => {
    setIsMockInterview(false);
    
    // Generate feedback based on answers
    const feedback = {
      overallScore: 85,
      strengths: [
        'Clear communication',
        'Good technical knowledge',
        'Structured answers'
      ],
      improvements: [
        'Provide more specific examples',
        'Show more enthusiasm',
        'Ask follow-up questions'
      ],
      categoryScores: {
        'Technical': 90,
        'Behavioral': 80,
        'Company-Specific': 85,
        'Problem-Solving': 85
      }
    };
    
    setInterviewFeedback(feedback);
    addAgentMessage(`✅ Mock interview completed! Overall score: ${feedback.overallScore}/100`);
  };

  // Save answer for current question
  const saveAnswer = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
            Strategic Win Room
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered interview preparation and mock interview practice
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-pink-400 border-pink-400">
            <Target className="h-3 w-3 mr-1" />
            Interview Prep
          </Badge>
          {agentMode === 'autonomous' && (
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preparation">Preparation</TabsTrigger>
          <TabsTrigger value="mock-interview">Mock Interview</TabsTrigger>
          <TabsTrigger value="company-research">Company Research</TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Analytics</TabsTrigger>
        </TabsList>

        {/* Preparation Tab */}
        <TabsContent value="preparation" className="space-y-6">
          {/* Select Interview */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-400" />
                Select Interview
              </CardTitle>
              <CardDescription>
                Choose an upcoming interview to prepare for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {interviewingApplications.length > 0 ? (
                <div className="grid gap-4">
                  {interviewingApplications.map((app) => (
                    <Card 
                      key={app.id} 
                      className={`cursor-pointer transition-all ${
                        selectedApplication?.id === app.id 
                          ? 'ring-2 ring-pink-400 bg-pink-400/10' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedApplication(app)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{app.jobTitle}</h3>
                            <p className="text-sm text-muted-foreground">{app.company}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {app.interviewDate?.toLocaleDateString()} • {app.interviewType}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              {app.fitScore}% Match
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Upcoming Interviews</h3>
                  <p className="text-muted-foreground">
                    Apply to jobs to schedule interviews and use this feature
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interviewer Profile (Optional) */}
          {selectedApplication && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-400" />
                  Interviewer Profile (Optional)
                </CardTitle>
                <CardDescription>
                  Add interviewer's LinkedIn profile for personalized preparation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="interviewer-profile">LinkedIn Profile URL</Label>
                  <Input
                    id="interviewer-profile"
                    placeholder="https://linkedin.com/in/interviewer-name"
                    value={interviewerProfile}
                    onChange={(e) => setInterviewerProfile(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps AI generate more targeted questions based on interviewer's background
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Questions */}
          {selectedApplication && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-pink-400" />
                  AI Question Generation
                </CardTitle>
                <CardDescription>
                  Generate personalized interview questions based on your profile and the job
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => generateInterviewQuestions(selectedApplication)}
                  disabled={isGeneratingQuestions}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate Interview Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generated Questions */}
          {generatedQuestions.length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-pink-400" />
                  Generated Questions ({generatedQuestions.length})
                </CardTitle>
                <CardDescription>
                  AI-generated questions tailored for your interview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedQuestions.map((q, index) => (
                  <Card key={q.id} className="border border-accent">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className={
                          q.category === 'Technical' ? 'text-blue-400 border-blue-400' :
                          q.category === 'Behavioral' ? 'text-green-400 border-green-400' :
                          q.category === 'Company-Specific' ? 'text-purple-400 border-purple-400' :
                          'text-orange-400 border-orange-400'
                        }>
                          {q.category}
                        </Badge>
                        <Badge variant="outline" className={
                          q.difficulty === 'Easy' ? 'text-green-400 border-green-400' :
                          q.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400' :
                          'text-red-400 border-red-400'
                        }>
                          {q.difficulty}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium mb-2">{q.question}</h4>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><Clock className="h-3 w-3 inline mr-1" />Expected duration: {q.expectedDuration}</p>
                        <p><Lightbulb className="h-3 w-3 inline mr-1" />Tip: {q.tips}</p>
                        {q.followUp && (
                          <p><MessageSquare className="h-3 w-3 inline mr-1" />Follow-up: {q.followUp}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={startMockInterview}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Mock Interview
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Mock Interview Tab */}
        <TabsContent value="mock-interview" className="space-y-6">
          {!isMockInterview ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready for Mock Interview?</h3>
                <p className="text-muted-foreground mb-4">
                  Generate questions first, then start your practice session
                </p>
                <Button 
                  onClick={startMockInterview}
                  disabled={generatedQuestions.length === 0}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Mock Interview
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Interview Progress */}
              <Card className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Mock Interview in Progress</h3>
                    <Badge variant="outline" className="text-pink-400 border-pink-400">
                      Question {currentQuestionIndex + 1} of {generatedQuestions.length}
                    </Badge>
                  </div>
                  <Progress 
                    value={(currentQuestionIndex / generatedQuestions.length) * 100} 
                    className="mb-4"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentQuestionIndex(Math.min(generatedQuestions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === generatedQuestions.length - 1}
                    >
                      Next
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={endMockInterview}
                    >
                      <Square className="h-3 w-3 mr-1" />
                      End Interview
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Question */}
              {generatedQuestions[currentQuestionIndex] && (
                <Card className="glass">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-pink-400" />
                        Interview Question
                      </CardTitle>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {generatedQuestions[currentQuestionIndex].category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-medium text-lg mb-2">
                        {generatedQuestions[currentQuestionIndex].question}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Expected duration: {generatedQuestions[currentQuestionIndex].expectedDuration}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="answer">Your Answer</Label>
                      <Textarea
                        id="answer"
                        placeholder="Type your answer here..."
                        value={userAnswers[currentQuestionIndex] || ''}
                        onChange={(e) => saveAnswer(e.target.value)}
                        rows={6}
                      />
                    </div>
                    
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm">
                        <Lightbulb className="h-3 w-3 inline mr-1 text-blue-400" />
                        <strong>Tip:</strong> {generatedQuestions[currentQuestionIndex].tips}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Company Research Tab */}
        <TabsContent value="company-research" className="space-y-6">
          {selectedApplication ? (
            <div className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-pink-400" />
                    Company Research
                  </CardTitle>
                  <CardDescription>
                    AI-powered research on {selectedApplication.company}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => researchCompany(selectedApplication.company)}
                    disabled={isResearching}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    {isResearching ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Research Company
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {companyResearch && (
                <div className="grid gap-6">
                  {/* Company Overview */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Company Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{companyResearch.overview}</p>
                    </CardContent>
                  </Card>

                  {/* Values & Culture */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Values & Culture</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Core Values</h4>
                        <div className="flex flex-wrap gap-2">
                          {companyResearch.values.map((value, index) => (
                            <Badge key={index} variant="outline" className="text-pink-400 border-pink-400">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Culture</h4>
                        <p className="text-muted-foreground">{companyResearch.culture}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent News */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Recent News</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {companyResearch.recentNews.map((news, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-muted-foreground">{news}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Tech Stack */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle>Technology Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {companyResearch.techStack.map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-blue-400 border-blue-400">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an Interview First</h3>
                <p className="text-muted-foreground">
                  Choose an interview from the Preparation tab to research the company
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Feedback & Analytics Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {interviewFeedback ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-pink-400" />
                    Interview Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-pink-400 mb-2">
                      {interviewFeedback.overallScore}/100
                    </div>
                    <p className="text-muted-foreground">Overall Interview Score</p>
                  </div>
                </CardContent>
              </Card>

              {/* Category Scores */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(interviewFeedback.categoryScores).map(([category, score]) => (
                    <div key={category}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{category}</span>
                        <span className="text-pink-400">{score}/100</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <ThumbsUp className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {interviewFeedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-400">
                      <TrendingUp className="h-5 w-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {interviewFeedback.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-400" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Feedback Available</h3>
                <p className="text-muted-foreground">
                  Complete a mock interview to see your performance analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewPage;

