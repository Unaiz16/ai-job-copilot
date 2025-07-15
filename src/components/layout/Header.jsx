import React from 'react';
import { Brain, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = ({ profile, agentMode, onToggleAutonomous }) => {
  return (
    <header className="glass sticky top-0 z-50 w-full border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="h-8 w-8 text-primary ai-pulse" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                AI Job Copilot
              </h1>
              <p className="text-xs text-muted-foreground">
                Autonomous Career Agent
              </p>
            </div>
          </div>

          {/* Agent Status */}
          <div className="flex items-center space-x-4">
            {/* Autonomous Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Zap className={`h-4 w-4 ${agentMode === 'autonomous' ? 'text-green-400' : 'text-muted-foreground'}`} />
              <Button
                variant={agentMode === 'autonomous' ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleAutonomous}
                className={agentMode === 'autonomous' ? 'btn-autonomous' : ''}
              >
                {agentMode === 'autonomous' ? 'Autonomous' : 'Review First'}
              </Button>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {profile?.name || 'Setup Profile'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.name ? 'Ready for jobs' : 'Complete setup'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-chart-2 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

