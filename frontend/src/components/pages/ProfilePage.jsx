import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Star,
  TrendingUp,
  Download,
  Eye,
  Plus,
  Trash2,
  Settings,
  Shield,
  Link,
  Sparkles,
  Globe,
  Lock,
  Mail,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import config from '@/config/environment';

const ProfilePage = ({ profile, updateProfile, onSaveProfile, addAgentMessage }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggestingRoles, setIsSuggestingRoles] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [careerArtifacts, setCareerArtifacts] = useState(profile.artifacts || []);
  const [agentCredentials, setAgentCredentials] = useState([]);
  const fileInputRef = useRef(null);

  // Calculate profile completeness
  const calculateCompleteness = useCallback((profileData) => {
    const fields = [
      'name', 'email', 'summary', 'keySkills', 'yearsOfExperience',
      'education', 'jobRoles', 'locations', 'linkedinUrl', 'baseCV'
    ];
    const completed = fields.filter(field => profileData[field] && (typeof profileData[field] === 'string' ? profileData[field].trim() : true)).length;
    return Math.round((completed / fields.length) * 100);
  }, []);

  // Update profile completeness whenever profile changes
  useEffect(() => {
    if (profile) {
      const completeness = calculateCompleteness(profile);
      updateProfile({ profileCompleteness: completeness }, false); // Don't save immediately
    }
  }, [profile, calculateCompleteness, updateProfile]);

  // Handle file selection from the dialog
  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('document')) {
      addAgentMessage({ type: 'error', message: "Please upload a PDF or Word document for CV analysis." });
      return;
    }

    setUploadedFile(file);
    addAgentMessage({ type: 'info', message: `Selected file: ${file.name}. Ready to analyze.` });
    handleAnalyzeCV(file);

  }, [addAgentMessage, handleAnalyzeCV]);

  // Handle AI analysis
  const handleAnalyzeCV = useCallback(async (file) => {
    if (!file) return;

    setIsAnalyzing(true);
    addAgentMessage({ type: 'info', message: "Analyzing your CV with AI... This may take a moment." });

    try {
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      // Send to backend for AI analysis
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.extractProfile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData: {
            file: {
              data: base64,
              mimeType: file.type
            }
          },
          linkedinUrl: profile.linkedinUrl || '',
          artifacts: careerArtifacts
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setAnalysisResults(results);
        
        // Update profile with extracted data
        const updatedProfileData = {
          ...results, // Backend returns data directly
          baseCV: base64,
          baseCVfilename: file.name,
          lastAnalyzed: new Date().toISOString()
        };
        
        updateProfile(updatedProfileData, true); // Save to backend
        
        addAgentMessage({ type: 'success', message: `CV analysis complete! I've extracted your professional data and updated your Career DNA.` });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze CV');
      }
    } catch (error) {
      console.error('CV analysis failed:', error);
      addAgentMessage({ type: 'error', message: `CV analysis failed: ${error.message}` });
    } finally {
      setIsAnalyzing(false);
      setUploadedFile(null); // Reset after analysis
    }
  }, [profile.linkedinUrl, updateProfile, addAgentMessage, careerArtifacts]);

  // Handle role suggestions
  const handleSuggestRoles = useCallback(async () => {
    setIsSuggestingRoles(true);
    addAgentMessage({ type: 'info', message: "Analyzing your profile to suggest optimal job roles..." });

    try {
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.suggestRoles}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profile }),
      });

      if (response.ok) {
        const results = await response.json();
        const suggestedRoles = results.roles || [];
        
        updateProfile({ jobRoles: suggestedRoles.join(', ') }, true);
        addAgentMessage({ type: 'success', message: `I've suggested ${suggestedRoles.length} job roles based on your profile: ${suggestedRoles.join(', ')}` });
      } else {
        throw new Error('Failed to get role suggestions');
      }
    } catch (error) {
      console.error('Role suggestion failed:', error);
      addAgentMessage({ type: 'error', message: "Role suggestion failed. Please try again or enter roles manually." });
    } finally {
      setIsSuggestingRoles(false);
    }
  }, [profile, updateProfile, addAgentMessage]);

  // Handle manual profile updates
  const handleProfileUpdate = (field, value) => {
    updateProfile({ [field]: value }, false); // Update locally, don't save immediately
  };

  // Handle career artifacts
  const addCareerArtifact = useCallback(() => {
    setCareerArtifacts(prev => [...prev, { type: '', content: '', description: '' }]);
  }, []);

  const updateCareerArtifact = useCallback((index, field, value) => {
    const updated = [...careerArtifacts];
    updated[index][field] = value;
    setCareerArtifacts(updated);
    updateProfile({ artifacts: updated }, false);
  }, [careerArtifacts, updateProfile]);

  const removeCareerArtifact = useCallback((index) => {
    const updated = careerArtifacts.filter((_, i) => i !== index);
    setCareerArtifacts(updated);
    updateProfile({ artifacts: updated }, false);
  }, [careerArtifacts, updateProfile]);

  // Handle agent credentials
  const addAgentCredential = useCallback(() => {
    setAgentCredentials(prev => [...prev, { platform: '', email: '', password: '' }]);
  }, []);

  const updateAgentCredential = useCallback((index, field, value) => {
    const updated = [...agentCredentials];
    updated[index][field] = value;
    setAgentCredentials(updated);
  }, [agentCredentials]);

  const removeAgentCredential = useCallback((index) => {
    setAgentCredentials(agentCredentials.filter((_, i) => i !== index));
  }, [agentCredentials]);

  // Handle Google Drive linking
  const handleLinkGoogleDrive = useCallback(async () => {
    try {
      addAgentMessage({ type: 'info', message: "Opening Google Drive authentication..." });
      setTimeout(() => {
        updateProfile({ gdriveLinked: true }, true);
        addAgentMessage({ type: 'success', message: "Google Drive linked successfully! Created 'AI Job Copilot Applications' folder and 'My Application Pipeline' sheet." });
      }, 2000);
    } catch (error) {
      addAgentMessage({ type: 'error', message: "Failed to link Google Drive. Please try again." });
    }
  }, [addAgentMessage, updateProfile]);

  // Save profile
  const handleSaveProfile = useCallback(async () => {
    const success = await onSaveProfile(profile);
    if (success) {
      addAgentMessage({ type: 'success', message: "Your Living Career DNA has been updated successfully!" });
    } else {
      addAgentMessage({ type: 'error', message: "Failed to save profile. Please try again." });
    }
  }, [profile, onSaveProfile, addAgentMessage]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="heading-xl gradient-text mb-4">
            Your Career DNA
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            This is the agent's brain. Provide your CV, LinkedIn, and any other "artifacts" like past job descriptions or project notes. 
            The AI will synthesize them into a powerful unified profile.
          </p>
        </div>

        {/* CV Upload Section */}
        <Card className="glass card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>Upload CV to Build Profile</span>
            </CardTitle>
            <CardDescription>
              The fastest way to build your profile. The AI will do the work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="py-8">
                <LoadingSpinner 
                  size="lg" 
                  message="Analyzing CV with AI... Extracting skills, experience, and identifying opportunities for improvement."
                  aiMode 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Click to upload a file or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, TXT
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {profile.baseCVfilename && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground pt-4">
                    <FileText className="h-4 w-4" />
                    <span>Current CV: {profile.baseCVfilename}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Career Artifacts Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Career Artifacts (Optional)</span>
            </CardTitle>
            <CardDescription>
              Add more context for the AI, like job descriptions, project notes, or performance reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {careerArtifacts.map((artifact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Type (e.g., Job Description, Performance Review)"
                    value={artifact.type}
                    onChange={(e) => updateCareerArtifact(index, 'type', e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCareerArtifact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Brief description"
                  value={artifact.description}
                  onChange={(e) => updateCareerArtifact(index, 'description', e.target.value)}
                />
                <Textarea
                  placeholder="Paste content here..."
                  value={artifact.content}
                  onChange={(e) => updateCareerArtifact(index, 'content', e.target.value)}
                  rows={3}
                />
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addCareerArtifact}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Artifact
            </Button>
          </CardContent>
        </Card>

        {/* Profile Completeness Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Completeness</p>
                  <p className="text-2xl font-bold">{profile.profileCompleteness || 0}%</p>
                </div>
              </div>
              <Progress value={profile.profileCompleteness || 0} className="h-2" />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-chart-2/20 rounded-lg">
                  <Brain className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Career DNA Score</p>
                  <p className="text-2xl font-bold">{profile.careerDnaScore || 0}/100</p>
                </div>
              </div>
              <Progress value={profile.careerDnaScore || 0} className="h-2" />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-chart-3/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Skills Gaps</p>
                  <p className="text-2xl font-bold">{profile.skillsGaps?.length || 0}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Areas for improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={profile.name || ''}
                  onChange={(e) => handleProfileUpdate('name', e.target.value)}
                  placeholder="e.g., Jane Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Application Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleProfileUpdate('email', e.target.value)}
                  placeholder="e.g., jane.doe@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                <Input
                  id="linkedinUrl"
                  value={profile.linkedinUrl || ''}
                  onChange={(e) => handleProfileUpdate('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locations">Target Locations</Label>
                <Input
                  id="locations"
                  value={profile.locations || 'Berlin, Munich (Germany)'}
                  onChange={(e) => handleProfileUpdate('locations', e.target.value)}
                  placeholder="e.g., Berlin, Munich (Germany)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Professional Experience</Label>
                <Input
                  id="yearsOfExperience"
                  value={profile.yearsOfExperience || ''}
                  onChange={(e) => handleProfileUpdate('yearsOfExperience', e.target.value)}
                  placeholder="e.g., 5 years"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Profile */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span>Professional Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobRoles" className="flex items-center space-x-2">
                  <span>Desired Job Roles</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestRoles}
                    disabled={isSuggestingRoles}
                    className="p-1 h-6 w-6"
                  >
                    <Sparkles className="h-3 w-3" />
                  </Button>
                </Label>
                <Input
                  id="jobRoles"
                  value={profile.jobRoles || ''}
                  onChange={(e) => handleProfileUpdate('jobRoles', e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  disabled={isSuggestingRoles}
                />
                {isSuggestingRoles && (
                  <p className="text-xs text-muted-foreground">AI is suggesting roles...</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  value={profile.education || ''}
                  onChange={(e) => handleProfileUpdate('education', e.target.value)}
                  placeholder="AI will extract this from your CV."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keySkills">Languages</Label>
                <Input
                  id="languages"
                  value={profile.languages || ''}
                  onChange={(e) => handleProfileUpdate('languages', e.target.value)}
                  placeholder="e.g., German (C1), English (Fluent)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications & Licenses</Label>
                <Input
                  id="certifications"
                  value={profile.certifications || ''}
                  onChange={(e) => handleProfileUpdate('certifications', e.target.value)}
                  placeholder="e.g., PMP, AWS Certified Developer"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={profile.summary || ''}
                  onChange={(e) => handleProfileUpdate('summary', e.target.value)}
                  placeholder="Generated by AI after analyzing your CV."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keySkills">Key Skills</Label>
                <Textarea
                  id="keySkills"
                  value={profile.keySkills || ''}
                  onChange={(e) => handleProfileUpdate('keySkills', e.target.value)}
                  placeholder="Generated by AI after analyzing your CV."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <span>Agent Settings</span>
            </CardTitle>
            <CardDescription>
              Configure how the AI agent behaves when searching and applying for jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Autonomous Mode */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <Label htmlFor="autonomousMode" className="font-medium">Autonomous Application Mode</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow the agent to apply to high-fit jobs (>90%) on your behalf
                </p>
              </div>
              <Switch
                id="autonomousMode"
                checked={profile.autonomousMode || false}
                onCheckedChange={(checked) => handleProfileUpdate('autonomousMode', checked)}
              />
            </div>

            {/* Minimum Fit Score */}
            <div className="space-y-3">
              <Label>Set Minimum Fit Score</Label>
              <p className="text-sm text-muted-foreground">
                Only apply to jobs above this fit score. Check the balance to ensure high-quality applications.
              </p>
              <div className="px-4">
                <Slider
                  value={[profile.minimumFitScore || 85]}
                  onValueChange={(value) => handleProfileUpdate('minimumFitScore', value[0])}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>50%</span>
                  <span className="font-medium">{profile.minimumFitScore || 85}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="h-5 w-5 text-primary" />
              <span>Integrations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Drive Integration */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Google Drive & Sheets Sync</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically save generated documents and sync application pipeline
                  </p>
                </div>
              </div>
              {profile.gdriveLinked ? (
                <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Linked
                </Badge>
              ) : (
                <Button onClick={handleLinkGoogleDrive} variant="outline">
                  Link Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Credentials Vault */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>🔒 Agent Credentials Vault</span>
            </CardTitle>
            <CardDescription>
              Provide dedicated credentials for the agent to sign in and apply to jobs on your behalf. 
              This information is stored securely and is only used for job applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {agentCredentials.map((credential, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Platform (e.g., LinkedIn, StepStone)"
                    value={credential.platform}
                    onChange={(e) => updateAgentCredential(index, 'platform', e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAgentCredential(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Agent's Job-Seeking Email</Label>
                    <Input
                      type="email"
                      placeholder="e.g., jane.doe@email.com"
                      value={credential.email}
                      onChange={(e) => updateAgentCredential(index, 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agent's Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter password for the agent's email"
                      value={credential.password}
                      onChange={(e) => updateAgentCredential(index, 'password', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addAgentCredential}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Platform Credentials
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleSaveProfile}
            className="btn-ai"
            size="lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Profile & Settings
          </Button>
          
          {profile.baseCV && (
            <Button variant="outline" size="lg">
              <Eye className="h-4 w-4 mr-2" />
              Preview CV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

