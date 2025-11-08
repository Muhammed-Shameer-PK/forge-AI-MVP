export type ViewMode = 'analyze' | 'discover' | 'compose';
export type Theme = 'light' | 'dark';

export type FundingStage = "pre-seed" | "seed" | "pre-series-a" | "series-a+";

export interface FounderProfile {
  experience_years: number;
  team_size: number;
  runway_months: number;
  tech_stack: string[];
  location: string;
  funding_stage: FundingStage;
}

export interface AnalysisChunk {
  id: number;
  title: string;
  analysis: string;
  key_insights: string[];
}

export interface Synthesis {
  solution_guide: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface UserDrivenResponse {
  mode: 'user_driven';
  input_problem: string;
  refined_problem: string;
  founder_profile: FounderProfile;
  chunks: AnalysisChunk[];
  synthesis: Synthesis;
  sources?: GroundingSource[];
}

export interface Problem {
  id: number;
  problem_statement: string;
  simulated_source: string;
  freshness_timestamp: string;
  personalization_note: string;
}

export interface ProactiveDiscoveryResponse {
  mode: 'proactive_discovery';
  sector: string;
  founder_profile: FounderProfile;
  problems: Problem[];
  sources?: GroundingSource[];
}

// Composer Types
export type ActionStatus = "pending" | "in_progress" | "done";
export type ActionOwner = "founder" | "ai" | "tool";

export interface ActionTask {
  id: number;
  title: string;
  description: string;
  owner: ActionOwner;
  executable: boolean;
  command: string | null;
  status: ActionStatus;
  due_in_hours: number;
}

export interface InsightFusion {
  from_sources: string[];
  insight: string;
  confidence: number;
}

export type LiveDataSource = "slack" | "github" | "notion" | "email" | "market_news";
export interface LiveData {
    source: LiveDataSource;
    content: string;
    timestamp: string;
}

export type Priority = "urgent" | "high" | "medium" | "low";

export interface ComposedActionPlan {
    mode: 'compose';
    cap_id: string;
    generated_at: string;
    founder_profile: FounderProfile;
    priority: Priority;
    fusion_summary: string;
    fused_insights: InsightFusion[];
    action_plan: ActionTask[];
    execution_log: string[];
    next_heartbeat_in_seconds: number;
}