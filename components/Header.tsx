
import React from 'react';
import { Icon } from './common/Icon';

const Header: React.FC = () => {
    return (
        <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-40 w-full border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center space-x-3">
                    <Icon icon="briefcase" className="h-8 w-8 text-sky-400" />
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
                        AI Job Copilot
                    </h1>
                </div>
            </div>
        </header>
    );
};

export default Header;
