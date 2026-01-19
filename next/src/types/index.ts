// Stats cache types
export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

export interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  webSearchRequests: number;
  costUSD: number;
  contextWindow: number;
  maxOutputTokens?: number;
}

export interface LongestSession {
  sessionId: string;
  duration: number;
  messageCount: number;
  timestamp: string;
}

export interface StatsCache {
  version: number;
  lastComputedDate: string;
  dailyActivity: DailyActivity[];
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsage>;
  totalSessions: number;
  totalMessages: number;
  longestSession: LongestSession;
  firstSessionDate: string;
  hourCounts: Record<string, number>;
}

// Session index types
export interface SessionIndexEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
}

export interface SessionIndex {
  version: number;
  entries: SessionIndexEntry[];
}

// Project types
export interface Project {
  id: string;
  name: string;
  path: string;
  sessionCount: number;
  lastActivity: string;
}

// Message types for session content
export interface MessageContent {
  type: string;
  text?: string;
  tool_use_id?: string;
  name?: string;
  input?: unknown;
  content?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string | MessageContent[];
}

export interface SessionMessage {
  type: "user" | "assistant" | string;
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  timestamp: string;
  message: Message;
  cwd?: string;
  gitBranch?: string;
  isMeta?: boolean;
}

// Commit tracked by hook
export interface SessionCommit {
  commitHash: string;
  branch: string;
  repoUrl: string;
  cwd: string;
  timestamp: string;
}

// Session with messages
export interface Session {
  id: string;
  projectId: string;
  firstPrompt: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  messages?: SessionMessage[];
  commits?: SessionCommit[];
}

// API response types
export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectDetailResponse {
  project: Project;
  sessions: SessionIndexEntry[];
}

export interface SessionResponse {
  session: Session;
}

export interface StatsResponse {
  stats: StatsCache;
}
