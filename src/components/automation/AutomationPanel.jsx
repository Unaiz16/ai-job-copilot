import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';
import { Progress } from '../ui/progress.jsx';
import { Switch } from '../ui/switch.jsx';
import { Label } from '../ui/label.jsx';
import { Input } from '../ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import automationService from '../../services/automationService.js';

const AutomationPanel = ({ profile, onAutomationStart, onAutomationComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState(null);
  const [automationResults, setAutomationResults] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [settings, setSettings] = useState({
    autonomousMode: false,
    minFitScore: 70,
    maxApplications: 5,
    platforms: ['stepstone.de', 'indeed.de', 'xing.de'],
    searchParams: {
      keywords: '',
      location: 'Germany',
      remote: true
    }
  });

  // Test Browserless.io connection
  const testConnection = async () => {
    try {
      setTestResults({ testing: true });
      const result = await automationService.testAutomation();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Connection test failed',
        error: error.message
      });
    }
  };

  // Start automation
  const startAutomation = async () => {
    if (!profile?.name || !settings.searchParams.keywords) {
      alert('Please complete your profile and enter search keywords');
      return;
    }

    try {
      setIsRunning(true);
      setAutomationResults(null);
      
      if (onAutomationStart) {
        onAutomationStart();
      }

      const results = await automationService.startAutomation(
        profile,
        settings.searchParams,
        {
          autonomousMode: settings.autonomousMode,
          minFitScore: settings.minFitScore,
          maxApplications: settings.maxApplications,
          platforms: settings.platforms
        }
      );

      setAutomationResults(results);
      setCurrentAutomation(results);
      
      if (onAutomationComplete) {
        onAutomationComplete(results);
      }

    } catch (error) {
      console.error('Automation failed:', error);
      setAutomationResults({
        error: error.message,
        failed: true
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Stop automation
  const stopAutomation = async () => {
    if (currentAutomation?.automationId) {
      try {
        await automationService.cancelTask(currentAutomation.automationId);
        setIsRunning(false);
        setCurrentAutomation(null);
      } catch (error) {
        console.error('Failed to stop automation:', error);
      }
    }
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSearchParams = (key, value) => {
    setSettings(prev => ({
      ...prev,
      searchParams: {
        ...prev.searchParams,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Browserless.io Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnection} 
              variant="outline"
              disabled={testResults?.testing}
            >
              {testResults?.testing ? 'Testing...' : 'Test Connection'}
            </Button>
            
            {testResults && !testResults.testing && (
              <div className="flex items-center gap-2">
                <Badge variant={testResults.success ? 'success' : 'destructive'}>
                  {testResults.success ? 'Connected' : 'Failed'}
                </Badge>
                <span className="text-sm text-gray-400">
                  {testResults.message}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Autonomous Mode */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autonomous-mode">Autonomous Mode</Label>
              <p className="text-sm text-gray-400">
                Automatically submit applications without review
              </p>
            </div>
            <Switch
              id="autonomous-mode"
              checked={settings.autonomousMode}
              onCheckedChange={(checked) => updateSettings('autonomousMode', checked)}
            />
          </div>

          {/* Search Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="e.g., React Developer, Python Engineer"
                value={settings.searchParams.keywords}
                onChange={(e) => updateSearchParams('keywords', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Berlin, Munich, Remote"
                value={settings.searchParams.location}
                onChange={(e) => updateSearchParams('location', e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-fit-score">Minimum Fit Score</Label>
              <Select 
                value={settings.minFitScore.toString()} 
                onValueChange={(value) => updateSettings('minFitScore', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50% - Low threshold</SelectItem>
                  <SelectItem value="60">60% - Medium threshold</SelectItem>
                  <SelectItem value="70">70% - High threshold</SelectItem>
                  <SelectItem value="80">80% - Very high threshold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max-applications">Max Applications</Label>
              <Select 
                value={settings.maxApplications.toString()} 
                onValueChange={(value) => updateSettings('maxApplications', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 application</SelectItem>
                  <SelectItem value="3">3 applications</SelectItem>
                  <SelectItem value="5">5 applications</SelectItem>
                  <SelectItem value="10">10 applications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Control */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <Button 
                onClick={startAutomation}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={!testResults?.success}
              >
                Start Automation
              </Button>
            ) : (
              <Button 
                onClick={stopAutomation}
                variant="destructive"
              >
                Stop Automation
              </Button>
            )}
            
            {isRunning && (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm">Running automation...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automation Results */}
      {automationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Automation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {automationResults.failed ? (
              <div className="text-red-400">
                <p>Automation failed: {automationResults.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {automationResults.summary?.jobsFound || 0}
                    </div>
                    <div className="text-sm text-gray-400">Jobs Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {automationResults.summary?.applicationsAttempted || 0}
                    </div>
                    <div className="text-sm text-gray-400">Applications Attempted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {automationResults.summary?.applicationsSuccessful || 0}
                    </div>
                    <div className="text-sm text-gray-400">Applications Successful</div>
                  </div>
                </div>

                {/* Phase Status */}
                <div className="space-y-2">
                  {Object.entries(automationResults.phases || {}).map(([phase, data]) => (
                    <div key={phase} className="flex items-center justify-between">
                      <span className="capitalize">{phase.replace(/([A-Z])/g, ' $1')}</span>
                      <Badge variant={
                        data.status === 'completed' ? 'success' :
                        data.status === 'running' ? 'warning' :
                        data.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {data.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Errors */}
                {automationResults.summary?.errors?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">Errors:</h4>
                    <div className="space-y-1">
                      {automationResults.summary.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-300">
                          {error.phase}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomationPanel;

