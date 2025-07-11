
import React from 'react';
import { Icon } from './common/Icon';
import type { ActiveTab } from '../types';
import { TABS } from '../constants';

interface NavTabsProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    applicationCount: number;
}

const NavTabs: React.FC<NavTabsProps> = ({ activeTab, setActiveTab, applicationCount }) => {
    const ICONS_MAP: Record<ActiveTab, 'dashboard' | 'search' | 'applications' | 'profile' | 'reports' | 'document-duplicate'> = {
        'Dashboard': 'dashboard',
        'Find Jobs': 'search',
        'My Applications': 'applications',
        'Doc Generator': 'document-duplicate',
        'Reports': 'reports',
        'My Profile': 'profile',
    };
    
    return (
        <div className="bg-slate-800/50 backdrop-blur-md sticky top-[77px] z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${
                                activeTab === tab
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                            } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            <Icon icon={ICONS_MAP[tab]} className={`${
                                activeTab === tab ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                            } -ml-0.5 mr-2 h-5 w-5 transition-colors duration-200`} />
                            <span>{tab}</span>
                             {tab === 'My Applications' && applicationCount > 0 && (
                                <span className="ml-2 bg-indigo-500 text-indigo-100 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {applicationCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default NavTabs;