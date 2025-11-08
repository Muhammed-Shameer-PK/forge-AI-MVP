import React from 'react';
import { ViewMode, Theme } from '../types';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ZapIcon } from './icons/ZapIcon';
import { FlaskConicalIcon } from './icons/FlaskConicalIcon';

interface SidebarProps {
  activeMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  theme: Theme;
  onThemeChange: () => void;
  isComposerEnabled: boolean;
}

const NavButton: React.FC<{
  mode: ViewMode;
  activeMode: ViewMode;
  onClick: (mode: ViewMode) => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}> = ({ mode, activeMode, onClick, disabled = false, title, children }) => {
  const isActive = activeMode === mode;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e1f20] focus:ring-blue-500 ${
        isActive
          ? 'bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-300'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-pressed={isActive}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeMode, onModeChange, theme, onThemeChange, isComposerEnabled }) => {
  return (
    <div className="w-64 bg-[#1e1f20] border-r border-white/10 p-4 flex flex-col">
      <div className="flex items-center space-x-3 mb-10 px-2">
        <BrainCircuitIcon className="w-8 h-8 text-blue-500 dark:text-[#89b4fa]" />
        <h1 className="text-xl font-bold text-white tracking-tight">
          Forge-<span className="gemini-gradient-text">AI</span>
        </h1>
      </div>
      
      <nav className="flex flex-col space-y-2">
        <NavButton mode="analyze" activeMode={activeMode} onClick={onModeChange}>
          <FlaskConicalIcon className="w-5 h-5" />
          <span>Analyze</span>
        </NavButton>
        <NavButton mode="discover" activeMode={activeMode} onClick={onModeChange}>
          <SearchIcon className="w-5 h-5" />
          <span>Discover</span>
        </NavButton>
        <NavButton
          mode="compose"
          activeMode={activeMode}
          onClick={onModeChange}
          disabled={!isComposerEnabled}
          title={!isComposerEnabled ? "Complete analysis and discovery first" : "Fuse insights"}
        >
          <ZapIcon className="w-5 h-5" />
          <span>Composer</span>
        </NavButton>
      </nav>

      <div className="mt-auto">
        <button
          onClick={onThemeChange}
          className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e1f20] focus:ring-blue-500"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
