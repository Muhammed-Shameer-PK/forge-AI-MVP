import { GoogleGenAI, Type } from "@google/genai";
import { 
    UserDrivenResponse, 
    ProactiveDiscoveryResponse, 
    FounderProfile,
    ComposedActionPlan,
    Problem,
    LiveData,
    Priority,
    GroundingSource
} from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please provide a valid API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleGeminiError = (error: any, context: string): never => {
  console.error(`Error ${context}:`, error);
  const errorMessage = String(error);
  if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
    throw new Error("You've exceeded your API quota. Please check your plan and billing details on Google AI Studio. You might need to wait a bit before trying again.");
  }
  throw new Error(`Failed to ${context}. Please check your network connection and try again.`);
};

const cleanJsonString = (text: string): string => {
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    return jsonText;
}

const extractSources = (response: any): GroundingSource[] | undefined => {
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks)) {
      return groundingChunks
        .filter((chunk: any) => chunk.web && chunk.web.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || new URL(chunk.web.uri).hostname,
          uri: chunk.web.uri,
        }));
    }
    return undefined;
}

const composedActionPlanSchema = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING, enum: ['compose'] },
    cap_id: { type: Type.STRING, description: "UUID v4" },
    generated_at: { type: Type.STRING, description: "ISO 8601 UTC" },
    founder_profile: {
      type: Type.OBJECT,
      properties: {
        experience_years: { type: Type.INTEGER },
        team_size: { type: Type.INTEGER },
        runway_months: { type: Type.INTEGER },
        tech_stack: { type: Type.ARRAY, items: { type: Type.STRING } },
        location: { type: Type.STRING },
        funding_stage: { type: Type.STRING, enum: ["pre-seed", "seed", "pre-series-a", "series-a+"] },
      },
      required: ['experience_years', 'team_size', 'runway_months', 'tech_stack', 'location', 'funding_stage'],
    },
    priority: { type: Type.STRING, enum: ["urgent", "high", "medium", "low"] },
    fusion_summary: { type: Type.STRING },
    fused_insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          from_sources: { type: Type.ARRAY, items: { type: Type.STRING } },
          insight: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ['from_sources', 'insight', 'confidence'],
      },
    },
    action_plan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          owner: { type: Type.STRING, enum: ["founder", "ai", "tool"] },
          executable: { type: Type.BOOLEAN },
          command: { type: Type.STRING, nullable: true },
          status: { type: Type.STRING, enum: ["pending", "in_progress", "done"] },
          due_in_hours: { type: Type.INTEGER },
        },
        required: ['id', 'title', 'description', 'owner', 'executable', 'command', 'status', 'due_in_hours'],
      },
    },
    execution_log: { type: Type.ARRAY, items: { type: Type.STRING } },
    next_heartbeat_in_seconds: { type: Type.INTEGER },
  },
  required: ['mode', 'cap_id', 'generated_at', 'founder_profile', 'priority', 'fusion_summary', 'fused_insights', 'action_plan', 'execution_log', 'next_heartbeat_in_seconds'],
};


export const analyzeProblem = async (problem: string, founderProfile: FounderProfile): Promise<UserDrivenResponse> => {
  const systemInstruction = `
    You are SolveForge AI, a personalized co-pilot for founders. Your task is to analyze a user-submitted problem and generate a structured JSON report that is DEEPLY PERSONALIZED to the provided founder's profile.

    **CRITICAL DIRECTIVE:** You have access to Google Search. You MUST use it to find factual, up-to-date information for your analysis. **DO NOT fabricate data** for competitors, market size (TAM), technology trends, or government schemes. Your analysis must be grounded in real-world, verifiable data from the web.

    Founder Profile for this analysis: ${JSON.stringify(founderProfile)}

    Follow this 8-step process with absolute precision, grounding each step with search results where applicable:
    1.  **Refine Problem:** Rewrite the user's input into a precise, actionable problem statement. Incorporate context from the founder's profile.
    2.  **Chunk 1 - Existing Solutions & Gaps:** The chunk title must be exactly "Existing Solutions & Gaps". Use search to find 3-5 real competitors or existing solutions. Analyze them based on the founder's constraints (runway, team size). Note gaps that are exploitable.
    3.  **Chunk 2 - Feasibility & Scalability:** The chunk title must be exactly "Feasibility & Scalability". Your analysis MUST be based on the founder's runway and team size.
        -   **MVP Cost:** Use this logic: runway <= 3 months -> '< ₹50,000'; runway <= 6 months -> '₹50K - ₹2 Lakh'; else -> '₹2L - ₹10L'.
        -   **Tech Stack:** Recommend a stack that aligns with the founder's preferred tech_stack. Use search if necessary to find modern, cost-effective technologies.
        -   **Scalability:** Rate as Low, Medium, or High, justifying it based on the recommended tech stack.
    4.  **Chunk 3 - Market & Edge:** The chunk title must be exactly "Market & Edge".
        -   **TAM:** Use search to find a credible market size (TAM). Narrow it down to the founder's location if possible. Cite the source of your data in the analysis text.
        -   **Target User & UVP:** Define a specific user persona relevant to the location.
        -   **Govt Support:** Use search to find relevant Indian government schemes if applicable.
    5.  **Chunk 4 - Resources & Timeline:** The chunk title must be exactly "Resources & Timeline".
        -   **Team:** The team composition must match the founder's team_size.
        -   **Timeline:** The MVP timeline must be realistic for the founder's runway_months: runway <= 3 months -> '2-3 weeks'; runway <= 6 months -> '4-6 weeks'; else -> '2-3 months'.
    6.  **Chunk 5 - Ethics & Risks:** The chunk title must be exactly "Ethics & Risks". Identify 1-2 risks directly related to the founder's context.
    7.  **Synthesis:** Create a 'solution_guide' with 5-7 concrete, actionable steps the founder can take immediately.
    8.  **Output:** The entire output MUST be a single, valid JSON object. Do not wrap the JSON in markdown code fences (e.g., \`\`\`json). The JSON structure must be: { "mode": "user_driven", "input_problem": "string", "refined_problem": "string", "founder_profile": { ...founder profile object... }, "chunks": [ { "id": number, "title": "string", "analysis": "string", "key_insights": ["string"] } ], "synthesis": { "solution_guide": ["string"] } }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Analyze this problem: "${problem}"`,
      config: {
        tools: [{googleSearch: {}}],
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    const jsonText = cleanJsonString(response.text);
    const result = JSON.parse(jsonText) as UserDrivenResponse;
    result.sources = extractSources(response);
    
    return result;
  } catch (error) {
    handleGeminiError(error, "analyze the problem");
  }
};


export const discoverOpportunities = async (sector: string, founderProfile: FounderProfile): Promise<ProactiveDiscoveryResponse> => {
  const systemInstruction = `
    You are SolveForge AI, a personalized co-pilot for founders. Your task is to scan a given sector and generate a JSON report of exactly 5 "hot" problems that are HIGHLY PERSONALIZED and viable for the provided founder's profile.

    **CRITICAL DIRECTIVE:** You have access to Google Search. You MUST use it to find real, emerging pain points from sources like tech news, forums, and market reports. **Do not simulate or invent problems.**

    Founder Profile for this discovery: ${JSON.stringify(founderProfile)}

    Follow this 4-step process with absolute precision:
    1.  **Identify Sector:** The user's input is the sector to scan.
    2.  **Scan for Real Problems:** Use Google Search to find recent, real-world pain points, challenges, or gaps in the specified sector.
    3.  **Generate 5 Personalized Hot Problems:** From your search results, generate 5 diverse problems. Each problem MUST be filtered and framed to be a perfect fit for the founder's profile.
        -   **Viability Filter:** Only select problems that can be addressed with an MVP within the founder's runway_months and by their team_size. Do not suggest capital-intensive or large-team ideas.
        -   **Tech Stack Alignment:** Prioritize problems that can be solved using the founder's preferred tech_stack.
        -   **Location Relevance:** Find problems that are particularly acute or offer a unique advantage in the founder's location.
        -   **Personalization Note:** For each problem, you MUST write a concise 'personalization_note' explaining *why* this specific problem is a good fit for this founder. Example: "Fits your 3-month runway: solvable in 10 days with under ₹30K," or "Leverages your team's Python skills and is a major issue in your location."
        -   **Source:** The 'simulated_source' should reflect the real type of source found (e.g., 'TechCrunch Article', 'HackerNews Comment').
        -   **Timestamp:** Provide a recent ISO 8601 timestamp for each problem.
    4.  **Output:** The entire output MUST be a single, valid JSON object with exactly 5 problems. Do not wrap the JSON in markdown code fences (e.g., \`\`\`json).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Scan this sector: "${sector}"`,
      config: {
        tools: [{googleSearch: {}}],
        systemInstruction: systemInstruction,
      },
    });
    
    const jsonText = cleanJsonString(response.text);
    const result = JSON.parse(jsonText) as ProactiveDiscoveryResponse;
    result.sources = extractSources(response);

    if (result.problems && result.problems.length > 5) {
        result.problems = result.problems.slice(0, 5);
    }
    return result;
  } catch (error) {
    handleGeminiError(error, "discover opportunities");
  }
};

export const composeActionPlan = async (
  analysis: UserDrivenResponse,
  opportunities: Problem[],
  liveData: LiveData[],
  founderProfile: FounderProfile,
  priority: Priority
): Promise<ComposedActionPlan> => {
  const systemInstruction = `
    You are the SolveForge AI "Composer," the central brain of Project Aura. Your purpose is to synthesize multiple data streams into a single, executable, cross-domain action plan. You must act as an autonomous agent, fusing insights and generating tangible actions. You are given a detailed problem analysis, a list of discovered opportunities, and a founder profile.

    Your mission is to follow these steps with absolute precision to generate a Composed Action Plan (CAP):

    1.  **SYNTHESIZE & FUSE:** Deeply analyze the provided 'analysis' object and the 'opportunities' array. Identify the most critical connections, contradictions, and synergies. The core of your task is to fuse these disparate data points into a single, coherent strategic direction.
    2.  **GENERATE FUSION SUMMARY:** Write a concise 'fusion_summary' (2-3 sentences) that explains the primary strategic insight you derived from fusing the inputs. What is the big picture?
    3.  **CREATE FUSED INSIGHTS:** Generate 3-5 specific 'fused_insights'. Each insight must:
        -   Reference its 'from_sources' (e.g., "Analysis: Market & Edge", "Opportunity ID: 2").
        -   Contain a clear, actionable 'insight' statement.
        -   Assign a 'confidence' score (0.0 to 1.0) based on how well the source data supports the insight.
    4.  **BUILD THE ACTION PLAN:** Based on the fused insights, create a tangible 'action_plan' with 5-7 tasks.
        -   Each task must have a clear 'title' and 'description'.
        -   Assign an 'owner': 'founder' for strategic/manual tasks, 'ai' for analysis/research tasks you could perform, or 'tool' for automatable tasks.
        -   Set 'executable' to true only for 'tool' tasks that have a clear 'command'.
        -   Set a realistic 'due_in_hours' for each task, considering the founder's limited runway. Prioritize speed.
        -   All tasks must start with 'status' as 'pending'.
    5.  **METADATA & HOUSEKEEPING:**
        -   'mode' must be 'compose'.
        -   Generate a new UUID for 'cap_id'.
        -   Use the current ISO 8601 UTC timestamp for 'generated_at'.
        -   Populate 'founder_profile' with the provided data.
        -   Set the 'priority' based on the input.
        -   Initialize 'execution_log' with a single entry: "CAP Initiated. Awaiting execution.".
        -   Set 'next_heartbeat_in_seconds' to 86400 (24 hours).

    **CRITICAL OUTPUT DIRECTIVE:** Your entire output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not add any commentary or markdown formatting around the JSON.
  `;

  const requestPayload = {
    analysis,
    opportunities,
    liveData,
    founderProfile,
    priority
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Generate a Composed Action Plan based on this data: ${JSON.stringify(requestPayload)}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: composedActionPlanSchema,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    const jsonText = cleanJsonString(response.text);
    const result = JSON.parse(jsonText) as ComposedActionPlan;
    
    return result;
  } catch (error) {
    handleGeminiError(error, "compose the action plan");
  }
};
