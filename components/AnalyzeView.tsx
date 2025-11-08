import React, { useState, useCallback } from 'react';
import { analyzeProblem } from '../services/geminiService';
import { UserDrivenResponse, AnalysisChunk, FounderProfile } from '../types';
import { Loader } from './Loader';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { FlaskConicalIcon } from './icons/FlaskConicalIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import FounderProfileForm from './FounderProfileForm';

interface AnalyzeViewProps {
  setResponse: (response: UserDrivenResponse | null) => void;
}

const AnalysisChunkCard: React.FC<{ chunk: AnalysisChunk }> = ({ chunk }) => {
  return (
    <div className="bg-white/5 dark:bg-[#1e1f20]/50 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg transition-all duration-300 hover:border-blue-400/50 hover:shadow-blue-500/10">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-blue-400 flex items-center gap-3">
            <FlaskConicalIcon className="w-5 h-5" />
            {chunk.title}
        </h3>
        <p className="mt-4 text-gray-400 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{chunk.analysis}</p>
        <div className="mt-6 border-t border-white/10 pt-4">
          <h4 className="text-md font-semibold text-gray-300 dark:text-gray-200 flex items-center gap-3"><LightbulbIcon className="w-5 h-5 text-yellow-400" /> Key Insights</h4>
          <ul className="mt-3 list-none space-y-2">
            {chunk.key_insights.map((insight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-400 mr-2">▪</span>
                <span className="text-gray-500 dark:text-gray-400">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const AnalyzeView: React.FC<AnalyzeViewProps> = ({ setResponse }) => {
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
  const [currentResponse, setCurrentResponse] = useState<UserDrivenResponse | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setCurrentResponse(null);
    setResponse(null);

    try {
      const result = await analyzeProblem(userInput, founderProfile);
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
      <h2 className="text-3xl md:text-4xl font-bold text-center gemini-gradient-text">Problem Analysis Engine</h2>
      <p className="text-center text-gray-400 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Get a deep, structured analysis grounded in real-world data and tailored to your founder profile.</p>
      
      <div className="mt-10 max-w-4xl mx-auto">
        <FounderProfileForm profile={founderProfile} setProfile={setFounderProfile} disabled={isLoading} />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 max-w-4xl mx-auto">
        <div className="gemini-glow-input border border-gray-500/30 rounded-lg p-0.5 transition-all duration-300">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter a problem to analyze, e.g., Predict crop failure for small Indian farmers..."
            className="w-full h-32 p-4 bg-[#1e1f20] dark:bg-[#1e1f20] rounded-md text-gray-200 dark:text-gray-200 placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none"
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center text-lg gemini-glow-button"
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? <><Loader /> <span className="ml-2">Thinking...</span></> : <><SparklesIcon className="w-5 h-5 mr-2"/>Forge Personalized Analysis</>}
        </button>
      </form>

      {error && <div className="mt-8 text-center text-red-400 bg-red-900/50 p-4 rounded-lg max-w-3xl mx-auto">{error}</div>}

      {currentResponse && (
        <div className="mt-12 max-w-4xl mx-auto animate-slide-up">
          <div className="bg-[#1e1f20]/50 border border-white/10 p-6 rounded-xl mb-8">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Original Problem</h3>
            <p className="text-gray-200 italic mt-1">"{currentResponse.input_problem}"</p>
            <hr className="my-4 border-white/10" />
            <h3 className="text-sm font-semibold gemini-gradient-text tracking-wider uppercase">Refined & Personalized Problem</h3>
            <p className="text-gray-100 font-medium text-xl mt-1">{currentResponse.refined_problem}</p>
          </div>
          
          <div className="space-y-6">
            {currentResponse.chunks.map((chunk) => (
              <AnalysisChunkCard key={chunk.id} chunk={chunk} />
            ))}
          </div>

          <div className="mt-8 bg-green-900/30 border border-green-400/30 rounded-xl p-6">
             <h3 className="text-xl font-semibold text-green-300">Solution Guide: Personalized MVP Steps</h3>
             <ol className="mt-4 list-decimal list-inside space-y-3 text-green-200">
                {currentResponse.synthesis.solution_guide.map((step, index) => (
                    <li key={index}>{step}</li>
                ))}
             </ol>
          </div>

          {currentResponse.sources && currentResponse.sources.length > 0 && (
            <div className="mt-8 bg-white/5 dark:bg-[#1e1f20]/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-200">Sources</h3>
                <p className="text-sm text-gray-500 mt-1">The analysis was grounded using information from the following web sources:</p>
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

export default AnalyzeView;