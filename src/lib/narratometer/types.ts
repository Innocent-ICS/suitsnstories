export type NarratometerProviderName = "GROQ" | "OPENROUTER";

export type NarratometerAgentKind =
  | "EXTRACTOR"
  | "NARRATIVE"
  | "INVESTOR_READINESS"
  | "DESIGN_SYSTEM"
  | "GUARDRAIL"
  | "ORCHESTRATOR";

export type NarratometerStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type DeckFileKind = "pdf" | "pptx" | "docx" | "image" | "text";

export interface UploadedDeckFile {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}

export interface ImageObservationInput {
  filename: string;
  mimeType: string;
  dataUrl: string;
  source: "upload" | "embedded" | "preprocessed";
}

export interface DeckPreprocessingSummary {
  originalBytes: number;
  analysisBytes: number;
  reductionPercent: number;
  notes: string[];
}

export interface DeckInput {
  kind: DeckFileKind;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fingerprint: string;
  extractedText: string;
  structuralNotes: string[];
  securityFlags: string[];
  images: ImageObservationInput[];
  preprocessing: DeckPreprocessingSummary;
  pdfDataUrl?: string;
}

export interface KnowledgeSnippet {
  id: string;
  title: string;
  source: string;
  content: string;
}

export interface AgentFinding {
  area: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  recommendation: string;
  nextStep: string;
}

export interface AgentResult {
  summary: string;
  score?: number;
  findings: AgentFinding[];
  strengths: string[];
  nextSteps: string[];
  risks?: string[];
}

export interface NarratometerReport {
  score: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  strengths: string[];
  attentionAreas: AgentFinding[];
  nextSteps: string[];
  agentSummaries: Record<string, string>;
  internalGuardrails?: {
    securityFlags: string[];
    privacyNotes: string[];
  };
  generatedAt: string;
}
