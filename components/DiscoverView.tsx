import React, { useState, useCallback } from 'react';
import { discoverOpportunities } from '../services/geminiService';
import { ProactiveDiscoveryResponse, Problem, FounderProfile } from '../types';
import { Loader } from './Loader';
import { SearchIcon } from './icons/SearchIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import FounderProfileForm from './FounderProfileForm';

interface DiscoverViewProps {
  setResponse: (response: ProactiveDiscoveryResponse | null) => void;
}

const OpportunityCard: React.FC<{ problem: Problem }> = ({ problem }) => {
    const timeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            if (seconds < 60) return "just now";
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        } catch (e) {
            return "a moment ago";
        }
    };

    return (
        <div className="bg-white/5 dark:bg-[#1e1f20]/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 transition-all duration-300 hover:border-blue-400/50 hover:shadow-blue-500/10 hover:-translate-y-1">
            <p className="text-lg font-medium text-gray-200 dark:text-gray-100">{problem.problem_statement}</p>
            <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-blue-300 flex items-start">
                    <SparklesIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="italic">{problem.personalization_note}</span>
                </p>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="bg-gray-200/10 dark:bg-gray-700/50 px-2 py-1 rounded-md text-xs">{problem.simulated_source}</span>
                <span>{timeAgo(problem.freshness_timestamp)}</span>
            </div>
        </div>
    );
};


const DiscoverView: React.FC<DiscoverViewProps> = ({ setResponse }) => {
  const [userInput, setUserInput] = useState('');
  const [founderProfile, setFounderProfile] = useState<FounderProfile>({
    experience_years: 2,
    team_size: 1,
    runway_months: 3,
    tech_stack: ['Python', 'React'],
    location: 'Patna, Bihar',
    funding_stage: 'pre-seed'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<ProactiveDiscoveryResponse | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setCurrentResponse(null);
    setResponse(null);

    try {
      const result = await discoverOpportunities(userInput, founderProfile);
      setCurrentResponse(result);
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [userInput, founderProfile, setResponse]);

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl md:text-4xl font-bold text-center gemini-gradient-text">Opportunity Scanner</h2>
      <p className="text-center text-gray-400 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Discover emerging, real-world problems tailored to your founder profile.</p>
      
      <div className="mt-10 max-w-4xl mx-auto">
        <FounderProfileForm profile={founderProfile} setProfile={setFounderProfile} disabled={isLoading} />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-4xl mx-auto">
        <div className="relative gemini-glow-input border border-gray-500/30 rounded-lg p-0.5 transition-all duration-300">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter a sector to scan, e.g., agritech, fintech..."
            className="w-full p-4 pl-12 bg-[#1e1f20] dark:bg-[#1e1f20] rounded-md text-gray-200 dark:text-gray-200 placeholder-gray-500 focus:outline-none transition-all duration-300"
            disabled={isLoading}
            required
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center text-lg gemini-glow-button"
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? <Loader /> : <><SparklesIcon className="w-5 h-5 mr-2"/>Scan for Personalized Opportunities</>}
        </button>
      </form>

      {error && <div className="mt-8 text-center text-red-400 bg-red-900/50 p-4 rounded-lg max-w-xl mx-auto">{error}</div>}

      {currentResponse && (
        <div className="mt-12 max-w-3xl mx-auto animate-slide-up">
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-200">
                Top 5 Opportunities in <span className="gemini-gradient-text">{currentResponse.sector}</span>
            </h3>
            <div className="space-y-4">
                {currentResponse.problems.map((problem) => (
                    <OpportunityCard key={problem.id} problem={problem} />
                ))}
            </div>

            {currentResponse.sources && currentResponse.sources.length > 0 && (
                <div className="mt-8 bg-white/5 dark:bg-[#1e1f20]/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-200">Sources</h3>
                    <p className="text-sm text-gray-500 mt-1">This scan was grounded using information from the following web sources:</p>
                    <ul className="mt-4 list-none space-y-2">
                        {currentResponse.sources.map((source, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-blue-400 mr-3 mt-1">🔗</span>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default DiscoverView;