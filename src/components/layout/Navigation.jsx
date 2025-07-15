import React from 'react';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  BarChart3, 
  User, 
  FileEdit,
  Briefcase,
  Target,
  Zap
} from 'lucide-react';
import { ActiveTab } from '@/types';

const Navigation = ({ activeTab, setActiveTab, applicationCount, agentMode }) => {
  const tabs = [
    {
      id: ActiveTab.DASHBOARD,
      label: 'Command Center',
      icon: LayoutDashboard,
      description: 'Agent overview & insights',
      color: 'text-blue-400'
    },
    {
      id: ActiveTab.FIND_JOBS,
      label: 'Opportunity Funnel',
      icon: Target,
      description: 'AI-powered job discovery',
      color: 'text-green-400'
    },
    {
      id: ActiveTab.MY_APPLICATIONS,
      label: 'Application Pipeline',
      icon: Briefcase,
      description: 'Track & manage applications',
      color: 'text-purple-400',
      count: applicationCount
    },
    {
      id: ActiveTab.INTERVIEWS,
      label: 'Strategic Win Room',
      icon: Target,
      description: 'Interview preparation',
      color: 'text-pink-400'
    },
    {
      id: ActiveTab.REPORTS,
      label: 'Intelligence Core',
      icon: BarChart3,
      description: 'Performance analytics',
      color: 'text-orange-400'
    },
    {
      id: ActiveTab.PROFILE,
      label: 'Career DNA',
      icon: User,
      description: 'Living professional profile',
      color: 'text-cyan-400'
    }
  ];

  return (
    <nav className="glass border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group relative flex items-center space-x-3 px-4 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? 'text-foreground border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${isActive ? tab.color : 'text-muted-foreground group-hover:' + tab.color}`} />
                  <span>{tab.label}</span>
                  
                  {/* Application count badge */}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                      {tab.count}
                    </span>
                  )}
                  
                  {/* Autonomous mode indicator */}
                  {tab.id === ActiveTab.FIND_JOBS && agentMode === 'autonomous' && (
                    <Zap className="h-3 w-3 text-green-400 animate-pulse" />
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

