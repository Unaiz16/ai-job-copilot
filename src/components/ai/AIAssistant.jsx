import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Maximize2, 
  Brain,
  Zap,
  User,
  Search,
  FileText,
  BarChart3,
  Target,
  Calendar,
  Building,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play,
  Settings,
  Lightbulb,
  Award,
  Clock,
  MapPin,
  Briefcase,
  Star,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Share2,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Textarea } from '../ui/textarea.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

const AIAssistant = ({ 
  profile, 
  activeTab, 
  agentMode, 
  applications = [], 
  jobs = [], 
  analytics = {},
  onExecuteCommand,
  onNavigateToTab,
  onUpdateProfile,
  onSearchJobs,
  onSubmitApplication,
  onStartInterview,
  onRunExperiment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI Career Agent. I can help you with your profile, find jobs, track applications, prepare for interviews, and analyze your performance. What would you like to know?",
      timestamp: new Date(),
      pillar: 'general',
      actions: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedCommands, setSuggestedCommands] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Update suggested commands based on current context
  useEffect(() => {
    updateSuggestedCommands();
  }, [activeTab, profile, applications, jobs, analytics]);

  // Update suggested commands based on current context
  const updateSuggestedCommands = useCallback(() => {
    const commands = [];
    
    // Context-aware suggestions based on current tab
    switch (activeTab) {
      case 'profile':
        commands.push(
          "How complete is my profile?",
          "What skills should I add?",
          "Optimize my professional summary"
        );
        break;
      case 'jobs':
        commands.push(
          "Find me remote jobs",
          "Search for senior developer roles",
          "Show high-fit opportunities"
        );
        break;
      case 'applications':
        commands.push(
          "What's my application status?",
          "Apply to all high-fit jobs",
          "Show application analytics"
        );
        break;
      case 'interview':
        commands.push(
          "Start mock interview",
          "Generate interview questions",
          "Research next company"
        );
        break;
      case 'analytics':
        commands.push(
          "Show performance metrics",
          "Run new experiment",
          "Analyze success patterns"
        );
        break;
      default:
        commands.push(
          "What can you help me with?",
          "Show my career overview",
          "Find new opportunities"
        );
    }
    
    setSuggestedCommands(commands);
  }, [activeTab]);

  // Process user input and generate AI response
  const processUserInput = async (input) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const response = await generateAIResponse(input);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        pillar: response.pillar,
        actions: response.actions || []
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Execute any commands if needed
      if (response.command && onExecuteCommand) {
        onExecuteCommand(response.command, response.params);
      }
      
    } catch (error) {
      console.error('Error processing user input:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        pillar: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate AI response based on user input
  const generateAIResponse = async (input) => {
    const lowerInput = input.toLowerCase();
    
    // Career DNA queries
    if (lowerInput.includes('skill') || lowerInput.includes('profile') || lowerInput.includes('experience')) {
      if (lowerInput.includes('top') && lowerInput.includes('skill')) {
        const topSkills = profile?.skills?.slice(0, 5) || ['React', 'JavaScript', 'Python', 'Node.js', 'TypeScript'];
        return {
          content: `Your top 5 skills are: ${topSkills.join(', ')}. These align well with current market demands in tech. Would you like me to suggest additional skills to learn?`,
          pillar: 'career-dna',
          actions: [
            { type: 'navigate', label: 'View Full Profile', target: 'profile' },
            { type: 'action', label: 'Add New Skills', action: 'add-skills' }
          ]
        };
      }
      
      if (lowerInput.includes('complete')) {
        const completeness = profile?.completeness || 85;
        return {
          content: `Your profile is ${completeness}% complete. ${completeness >= 90 ? 'Excellent! Your profile is very comprehensive.' : completeness >= 70 ? 'Good progress! Consider adding more details to reach 90%+.' : 'Your profile needs more information to attract top opportunities.'}`,
          pillar: 'career-dna',
          actions: [
            { type: 'navigate', label: 'Complete Profile', target: 'profile' }
          ]
        };
      }
      
      if (lowerInput.includes('gap') || lowerInput.includes('missing')) {
        return {
          content: "Based on current job market trends, you might benefit from adding: Cloud platforms (AWS/Azure), DevOps tools (Docker/Kubernetes), and AI/ML frameworks. These are highly sought after in today's market.",
          pillar: 'career-dna',
          actions: [
            { type: 'action', label: 'Add These Skills', action: 'add-trending-skills' }
          ]
        };
      }
    }
    
    // Job search queries
    if (lowerInput.includes('find') || lowerInput.includes('search') || lowerInput.includes('job')) {
      if (lowerInput.includes('remote')) {
        return {
          content: "I'll search for remote opportunities matching your profile. Found 23 remote positions with 80%+ fit scores. The top matches include Senior React Developer at TechCorp and Full Stack Engineer at StartupHub.",
          pillar: 'opportunity-funnel',
          command: 'search-jobs',
          params: { remote: true, minFitScore: 80 },
          actions: [
            { type: 'navigate', label: 'View All Jobs', target: 'jobs' },
            { type: 'action', label: 'Apply to Top Matches', action: 'apply-top-matches' }
          ]
        };
      }
      
      if (lowerInput.includes('berlin') || lowerInput.includes('munich')) {
        const city = lowerInput.includes('berlin') ? 'Berlin' : 'Munich';
        return {
          content: `Searching for opportunities in ${city}... Found 15 positions matching your profile. The market is particularly strong for React developers with your experience level.`,
          pillar: 'opportunity-funnel',
          command: 'search-jobs',
          params: { location: city },
          actions: [
            { type: 'navigate', label: `View ${city} Jobs`, target: 'jobs' }
          ]
        };
      }
      
      if (lowerInput.includes('fit score') || lowerInput.includes('match')) {
        return {
          content: "Your average fit score across recent opportunities is 78%. Your strongest matches (90%+) are typically React/Frontend roles at tech companies. Your profile particularly resonates with startups and scale-ups.",
          pillar: 'opportunity-funnel',
          actions: [
            { type: 'navigate', label: 'View High-Fit Jobs', target: 'jobs' }
          ]
        };
      }
    }
    
    // Application queries
    if (lowerInput.includes('application') || lowerInput.includes('apply') || lowerInput.includes('submit')) {
      if (lowerInput.includes('status') || lowerInput.includes('recent')) {
        const recentApps = applications.slice(0, 3);
        const statusSummary = recentApps.map(app => `${app.company}: ${app.status}`).join(', ');
        return {
          content: `Your recent applications: ${statusSummary || 'No recent applications'}. Overall success rate: 23% (above industry average of 18%).`,
          pillar: 'application-pipeline',
          actions: [
            { type: 'navigate', label: 'View All Applications', target: 'applications' }
          ]
        };
      }
      
      if (lowerInput.includes('today') || lowerInput.includes('submitted')) {
        return {
          content: "Today the agent submitted 3 applications: TechCorp (92% fit), StartupHub (88% fit), and DevCompany (85% fit). All applications included personalized cover letters and optimized profiles.",
          pillar: 'application-pipeline',
          actions: [
            { type: 'navigate', label: 'View Today\'s Applications', target: 'applications' }
          ]
        };
      }
      
      if (lowerInput.includes('automatically') || lowerInput.includes('all')) {
        return {
          content: "I can automatically apply to all jobs with 80%+ fit scores. This would include 7 current opportunities. Each application will be personalized with custom cover letters. Shall I proceed?",
          pillar: 'application-pipeline',
          actions: [
            { type: 'action', label: 'Start Auto-Apply', action: 'auto-apply-high-fit' },
            { type: 'action', label: 'Review Jobs First', action: 'review-before-apply' }
          ]
        };
      }
    }
    
    // Interview preparation queries
    if (lowerInput.includes('interview') || lowerInput.includes('mock') || lowerInput.includes('prepare')) {
      if (lowerInput.includes('start') || lowerInput.includes('mock')) {
        return {
          content: "I'll start a mock interview session for your upcoming TechCorp interview. I've generated 5 personalized questions covering technical skills, behavioral scenarios, and company-specific topics. Ready to begin?",
          pillar: 'interview-prep',
          command: 'start-interview',
          params: { company: 'TechCorp' },
          actions: [
            { type: 'navigate', label: 'Start Mock Interview', target: 'interview' },
            { type: 'action', label: 'Generate More Questions', action: 'generate-questions' }
          ]
        };
      }
      
      if (lowerInput.includes('question') || lowerInput.includes('generate')) {
        return {
          content: "Generated 8 interview questions tailored to your profile and the role: 3 technical (React, system design), 3 behavioral (teamwork, problem-solving), and 2 company-specific questions. Each includes strategic tips and expected duration.",
          pillar: 'interview-prep',
          actions: [
            { type: 'navigate', label: 'View Questions', target: 'interview' }
          ]
        };
      }
      
      if (lowerInput.includes('research') || lowerInput.includes('company')) {
        return {
          content: "Researched TechCorp: 500+ employees, Series C funded, strong engineering culture. Core values: Innovation, Collaboration, Customer Focus. Recent news: €50M funding, new AI product line. Tech stack matches your skills perfectly.",
          pillar: 'interview-prep',
          actions: [
            { type: 'navigate', label: 'View Full Research', target: 'interview' }
          ]
        };
      }
    }
    
    // Analytics queries
    if (lowerInput.includes('analytics') || lowerInput.includes('performance') || lowerInput.includes('experiment')) {
      if (lowerInput.includes('experiment') || lowerInput.includes('test')) {
        return {
          content: "Last A/B test results: Cover letter variation B increased response rate by 34%. Current experiment: Testing application timing (morning vs evening) - preliminary data shows 28% better response for morning applications.",
          pillar: 'intelligence-core',
          actions: [
            { type: 'navigate', label: 'View Full Analytics', target: 'analytics' },
            { type: 'action', label: 'Run New Experiment', action: 'new-experiment' }
          ]
        };
      }
      
      if (lowerInput.includes('success rate') || lowerInput.includes('metrics')) {
        return {
          content: "Your career metrics: 23% application success rate (vs 18% industry avg), 78% average fit score, 3.2 interviews per week. Top performing job boards: StepStone (31% success), LinkedIn (27%), Xing (19%).",
          pillar: 'intelligence-core',
          actions: [
            { type: 'navigate', label: 'View Detailed Metrics', target: 'analytics' }
          ]
        };
      }
    }
    
    // General help
    if (lowerInput.includes('help') || lowerInput.includes('what can you')) {
      return {
        content: "I can help you with: 📊 Profile optimization & skill analysis, 🔍 Smart job search & opportunity matching, 📝 Automated applications & cover letters, 🎯 Interview preparation & mock sessions, 📈 Performance analytics & A/B testing. What would you like to explore?",
        pillar: 'general',
        actions: [
          { type: 'navigate', label: 'Profile', target: 'profile' },
          { type: 'navigate', label: 'Job Search', target: 'jobs' },
          { type: 'navigate', label: 'Applications', target: 'applications' },
          { type: 'navigate', label: 'Interview Prep', target: 'interview' },
          { type: 'navigate', label: 'Analytics', target: 'analytics' }
        ]
      };
    }
    
    // Default response
    return {
      content: "I understand you're asking about your career development. Could you be more specific? I can help with profile optimization, job searching, application tracking, interview preparation, or performance analytics.",
      pillar: 'general',
      actions: [
        { type: 'action', label: 'Show Capabilities', action: 'show-capabilities' }
      ]
    };
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    await processUserInput(inputValue);
    setInputValue('');
  };

  // Handle suggested command click
  const handleSuggestedCommand = (command) => {
    setInputValue(command);
    handleSendMessage();
  };

  // Handle action button click
  const handleActionClick = (action) => {
    if (action.type === 'navigate' && onNavigateToTab) {
      onNavigateToTab(action.target);
    } else if (action.type === 'action' && onExecuteCommand) {
      onExecuteCommand(action.action, action.params);
    }
  };

  // Get pillar color
  const getPillarColor = (pillar) => {
    switch (pillar) {
      case 'career-dna': return 'text-blue-400 border-blue-400';
      case 'opportunity-funnel': return 'text-green-400 border-green-400';
      case 'application-pipeline': return 'text-purple-400 border-purple-400';
      case 'interview-prep': return 'text-pink-400 border-pink-400';
      case 'intelligence-core': return 'text-orange-400 border-orange-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  return (
    <>
      {/* AI Assistant Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg z-50"
          size="icon"
        >
          <Brain className="h-6 w-6" />
        </Button>
      )}

      {/* AI Assistant Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col glass shadow-2xl z-50">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-pink-400" />
              AI Career Agent
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-pink-600 text-white'
                          : 'bg-accent text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Action buttons for assistant messages */}
                      {message.type === 'assistant' && message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleActionClick(action)}
                              className="text-xs h-6"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      {/* Pillar badge */}
                      {message.pillar && message.pillar !== 'general' && (
                        <Badge 
                          variant="outline" 
                          className={`mt-2 text-xs ${getPillarColor(message.pillar)}`}
                        >
                          {message.pillar.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-accent rounded-lg p-3">
                      <LoadingSpinner size="sm" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Suggested Commands */}
              {suggestedCommands.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-1">
                    {suggestedCommands.slice(0, 3).map((command, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedCommand(command)}
                        className="text-xs h-6"
                      >
                        {command}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your career..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default AIAssistant;

