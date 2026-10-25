export interface ToolTrace {
  toolName: string;
  args: Record<string, any>;
  result: any;
  executionTimeMs: number;
  sqlOrFormula?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  traces?: ToolTrace[];
  stepsCount?: number;
}

export interface GymInfoRow {
  id: number;
  topic: string;
  title: string;
  category: string;
  content: string;
  keywords: string;
  updated_at: string;
}

export interface GymServiceRow {
  id: number;
  service_code: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  availability: string;
  description: string;
  duration_minutes: number;
}

export interface TicketRow {
  ticket_id: string;
  customer_name: string;
  contact_phone: string;
  issue_category: string;
  issue_description: string;
  urgency: string;
  created_at: string;
  status: string;
}

export interface TestCase {
  id: number;
  question: string;
  expectedTool: string;
  description: string;
  category: string;
}

export interface TestResult {
  id: number;
  question: string;
  expectedTool: string;
  actualTools: string[];
  passed: boolean;
  reply: string;
  executionTimeMs: number;
  tracesCount: number;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  totalTimeMs: number;
}
