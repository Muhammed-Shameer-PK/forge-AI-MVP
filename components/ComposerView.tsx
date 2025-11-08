import React, { useState, useCallback, useEffect } from 'react';
import { composeActionPlan } from '../services/geminiService';
import { 
    UserDrivenResponse, 
    Problem, 
    ComposedActionPlan,
    LiveData,
    Priority,
    ActionTask
} from '../types';
import { Loader } from './Loader';
import { ZapIcon } from './icons/ZapIcon';

interface ComposerViewProps {
  analysis: UserDrivenResponse | null;
  opportunities: Problem[];
}

const ActionTaskCard: React.FC<{ task: ActionTask }> = ({ task }) => {
    const getStatusPill = (status: ActionTask['status']) => {
        const styles = {
            pending: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20',
            in_progress: 'bg-blue-400/10 text-blue-300 border-blue-400/20',
            done: 'bg-green-400/10 text-green-300 border-green-400/20',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>{status.replace('_', ' ')}</span>;
    };

    return (
        <div className="bg-[#1e1f20]/50 border border-white/10 p-4 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-gray-100">{task.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                </div>
                {getStatusPill(task.status)}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-500 flex justify-between items-center">
                <span>Owner: <span className="font-medium text-gray-300">{task.owner}</span></span>
                <span>Due: <span className="font-medium text-gray-300">{task.due_in_hours} hours</span></span>
            </div>
            {task.executable && (
                <div className="mt-2 text-xs font-mono bg-black/30 p-2 rounded-md text-gray-400">
                    <span className="text-blue-400">$ &gt; </span>{task.command}
                </div>
            )}
        </div>
    );
};


const ComposerView: React.FC<ComposerViewProps> = ({ analysis, opportunities }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<ComposedActionPlan | null>(null);
    const [heartbeat, setHeartbeat] = useState(0);

    useEffect(() => {
        if (plan && plan.next_heartbeat_in_seconds > 0) {
            setHeartbeat(plan.next_heartbeat_in_seconds);
            const timer = setInterval(() => {
                setHeartbeat(h => {
                    if (h <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return h - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [plan]);

    const handleSubmit = useCallback(async () => {
        if (!analysis) return;

        setIsLoading(true);
        setError(null);
        setPlan(null);

        const liveDataItems: LiveData[] = [];
        const priority: Priority = 'high';
        
        try {
            const result = await composeActionPlan(analysis, opportunities, liveDataItems, analysis.founder_profile, priority);
            setPlan(result);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [analysis, opportunities]);

    if (!analysis || opportunities.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-300">Composer is Ready</h2>
                <p className="mt-2 text-gray-500">Please run both an analysis and a discovery scan first. <br/>The Composer uses these results as inputs to generate a fused action plan.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-center gemini-gradient-text">Composer Engine (MVP)</h2>
            <p className="text-center text-gray-400 mt-2 max-w-2xl mx-auto">Fuse analysis and opportunities into an executable action plan with one click.</p>
            
            <div className="mt-10 max-w-4xl mx-auto space-y-6">
                {!plan && (
                    <div className="text-center p-8 bg-[#1e1f20]/50 border border-white/10 rounded-xl">
                        <h3 className="text-xl font-bold text-gray-200">Ready to Synthesize</h3>
                        <p className="mt-2 text-gray-400">The results from your Analysis and Discovery scans are loaded. Click the button below to generate a composed action plan.</p>
                        <button
                            onClick={handleSubmit}
                            className="mt-6 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center text-lg gemini-glow-button mx-auto"
                            disabled={isLoading}
                        >
                            {isLoading ? <><Loader /><span className="ml-2">Thinking...</span></> : <><ZapIcon className="w-5 h-5 mr-2"/>Compose Action Plan</>}
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="mt-8 text-center text-red-400 bg-red-900/50 p-4 rounded-lg max-w-3xl mx-auto">{error}</div>}

            {plan && (
                <div className="mt-12 max-w-5xl mx-auto animate-slide-up space-y-8">
                    <div className="bg-[#1e1f20]/50 border border-white/10 p-6 rounded-xl">
                        <div className="flex justify-between items-center">
                             <h3 className="text-xl font-semibold gemini-gradient-text">Composed Action Plan</h3>
                             <div className="text-right">
                                <p className="text-sm text-gray-400">Next Heartbeat</p>
                                <p className="text-2xl font-mono font-bold text-gray-200">{String(Math.floor(heartbeat / 60)).padStart(2, '0')}:{String(heartbeat % 60).padStart(2, '0')}</p>
                             </div>
                        </div>
                        <p className="mt-2 text-gray-300">{plan.fusion_summary}</p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-gray-200">Fused Insights</h4>
                        <div className="space-y-3">
                            {plan.fused_insights.map((insight, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                                    <p className="text-gray-300">{insight.insight}</p>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Sources: {insight.from_sources.join(', ')} | Confidence: <span className="font-bold text-blue-400">{(insight.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-gray-200">Action Plan</h4>
                            <div className="space-y-3">
                                {plan.action_plan.map(task => <ActionTaskCard key={task.id} task={task} />)}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-gray-200">Execution Log</h4>
                            <div className="bg-black/50 border border-white/10 p-4 rounded-lg h-full font-mono text-sm text-gray-400 space-y-2 overflow-y-auto">
                                {plan.execution_log.map((log, index) => <p key={index}><span className="text-green-400">&gt; </span>{log}</p>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComposerView;