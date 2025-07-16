import React, { useState, useCallback, useRef } from 'react';
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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import config from '@/config/environment';

const ProfilePage = ({ profile, setProfile, onSaveProfile, addAgentMessage }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [careerDnaScore, setCareerDnaScore] = useState(0);
  const [skillsGaps, setSkillsGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const fileInputRef = useRef(null);

  // Calculate profile completeness
  const calculateCompleteness = useCallback((profileData) => {
    const fields = [
      'name', 'email', 'summary', 'keySkills', 'yearsOfExperience',
      'education', 'jobRoles', 'locations'
    ];
    const completed = fields.filter(field => profileData[field] && profileData[field].trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('document')) {
      addAgentMessage("Please upload a PDF or Word document for CV analysis.");
      return;
    }

    setUploadedFile(file);
    addAgentMessage("CV uploaded successfully! Click 'Analyze & Build Profile with AI' to extract your professional data.");
  }, [addAgentMessage]);

  // Handle AI analysis
  const handleAnalyzeCV = useCallback(async () => {
    if (!uploadedFile) return;

    setIsAnalyzing(true);
    addAgentMessage("Analyzing your CV with AI... This may take a moment.");

    try {
      // Convert file to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(uploadedFile);
      });

      // Send to backend for AI analysis
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.extractProfile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData: base64,
          filename: uploadedFile.name,
          mimeType: uploadedFile.type
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setAnalysisResults(results);
        
        // Update profile with extracted data
        const updatedProfile = {
          ...profile,
          ...results.extractedData,
          baseCV: base64,
          baseCVfilename: uploadedFile.name,
          lastAnalyzed: new Date().toISOString()
        };
        
        setProfile(updatedProfile);
        
        // Calculate scores and gaps
        const completeness = calculateCompleteness(updatedProfile);
        setProfileCompleteness(completeness);
        setCareerDnaScore(results.careerDnaScore || 75);
        setSkillsGaps(results.skillsGaps || []);
        setRecommendations(results.recommendations || []);
        
        addAgentMessage(`CV analysis complete! I've extracted your professional data and identified ${results.skillsGaps?.length || 0} areas for improvement.`);
      } else {
        throw new Error('Failed to analyze CV');
      }
    } catch (error) {
      console.error('CV analysis failed:', error);
      addAgentMessage("CV analysis failed. Please try again or enter your information manually.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFile, profile, setProfile, calculateCompleteness, addAgentMessage]);

  // Handle manual profile updates
  const handleProfileUpdate = useCallback((field, value) => {
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);
    setProfileCompleteness(calculateCompleteness(updatedProfile));
  }, [profile, setProfile, calculateCompleteness]);

  // Save profile
  const handleSaveProfile = useCallback(async () => {
    const success = await onSaveProfile(profile);
    if (success) {
      addAgentMessage("Your Living Career DNA has been updated successfully!");
    } else {
      addAgentMessage("Failed to save profile. Please try again.");
    }
  }, [profile, onSaveProfile, addAgentMessage]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="heading-xl gradient-text mb-4">
            Living Career DNA
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Dynamic, multi-dimensional professional profile that evolves with AI analysis and gap identification
          </p>
        </div>

        {/* CV Upload Section */}
        <Card className="glass card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>AI-Powered CV Analysis</span>
            </CardTitle>
            <CardDescription>
              Upload your CV for intelligent extraction and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isAnalyzing ? (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drop your CV here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports PDF and Word documents
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadedFile && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Uploaded: {uploadedFile.name}</span>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleAnalyzeCV}
                        className="btn-ai"
                        size="lg"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze & Build Profile with AI
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8">
                <LoadingSpinner 
                  size="lg" 
                  message="Analyzing CV with AI... Extracting skills, experience, and identifying opportunities for improvement."
                  aiMode 
                />
              </div>
            )}
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
                  <p className="text-2xl font-bold">{profileCompleteness}%</p>
                </div>
              </div>
              <Progress value={profileCompleteness} className="h-2" />
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
                  <p className="text-2xl font-bold">{careerDnaScore}/100</p>
                </div>
              </div>
              <Progress value={careerDnaScore} className="h-2" />
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
                  <p className="text-2xl font-bold">{skillsGaps.length}</p>
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
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleProfileUpdate('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locations">Preferred Locations</Label>
                <Input
                  id="locations"
                  value={profile.locations || 'Germany'}
                  onChange={(e) => handleProfileUpdate('locations', e.target.value)}
                  placeholder="e.g., Berlin, Munich, Hamburg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
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
                <Label htmlFor="jobRoles">Target Job Roles</Label>
                <Input
                  id="jobRoles"
                  value={profile.jobRoles || ''}
                  onChange={(e) => handleProfileUpdate('jobRoles', e.target.value)}
                  placeholder="e.g., Software Engineer, DevOps Engineer"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keySkills">Key Skills</Label>
                <Textarea
                  id="keySkills"
                  value={profile.keySkills || ''}
                  onChange={(e) => handleProfileUpdate('keySkills', e.target.value)}
                  placeholder="List your key technical and soft skills..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={profile.summary || ''}
                  onChange={(e) => handleProfileUpdate('summary', e.target.value)}
                  placeholder="Brief summary of your professional background and career objectives..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills Gaps and Recommendations */}
        {(skillsGaps.length > 0 || recommendations.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skills Gaps */}
            {skillsGaps.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-chart-3" />
                    <span>Skills Gaps Identified</span>
                  </CardTitle>
                  <CardDescription>
                    Areas where you can strengthen your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {skillsGaps.map((gap, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-chart-3/10 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-chart-3 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{gap.skill}</p>
                          <p className="text-xs text-muted-foreground">{gap.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>AI Recommendations</span>
                  </CardTitle>
                  <CardDescription>
                    Strategic suggestions to improve your career prospects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-primary/10 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{rec.title}</p>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleSaveProfile}
            className="btn-ai"
            size="lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Career DNA
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

