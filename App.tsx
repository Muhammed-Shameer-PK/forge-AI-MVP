import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AnalyzeView from './components/AnalyzeView';
import DiscoverView from './components/DiscoverView';
import ComposerView from './components/ComposerView';
import { ViewMode, Theme, UserDrivenResponse, ProactiveDiscoveryResponse } from './types';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('analyze');
  const [theme, setTheme] = useState<Theme>('dark');
  const [analysisResponse, setAnalysisResponse] = useState<UserDrivenResponse | null>(null);
  const [discoveryResponse, setDiscoveryResponse] = useState<ProactiveDiscoveryResponse | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleViewChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleThemeChange = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const renderView = () => {
    switch (viewMode) {
      case 'analyze':
        return <AnalyzeView setResponse={setAnalysisResponse} />;
      case 'discover':
        return <DiscoverView setResponse={setDiscoveryResponse} />;
      case 'compose':
        return <ComposerView analysis={analysisResponse} opportunities={discoveryResponse?.problems || []} />;
      default:
        return <AnalyzeView setResponse={setAnalysisResponse} />;
    }
  };

  return (
    <div className="flex min-h-screen text-gray-800 dark:text-gray-200 font-sans antialiased bg-gray-100 dark:bg-[#131314]">
      <Sidebar 
        activeMode={viewMode} 
        onModeChange={handleViewChange} 
        theme={theme}
        onThemeChange={handleThemeChange}
        isComposerEnabled={!!analysisResponse && !!discoveryResponse}
      />
      <div className="flex-1">
        <div className="min-h-screen dark:bg-grid-white/[0.05] bg-grid-black/[0.05] relative">
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <main>
              {renderView()}
            </main>
            <footer className="text-center text-gray-500 dark:text-gray-500 mt-12 pb-4">
              <p>Powered by Gemini. Designed for innovators.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;