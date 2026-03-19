export type RewriteStyle = 'standard' | 'modern' | 'executive';

export interface AnalysisResponse {
  analysis_id: number | null;
  ats_score: number;
  matched_skills: string[];
  missing_skills: string[];
  roast_and_advice: string;
}

export interface RewriteResponse {
  rewrite_id: number | null;
  analysis_id: number | null;
  style: RewriteStyle;
  html_resume: string;
}

export interface ParsedFeedback {
  roast: string;
  advice: string[];
}

export interface AnalysisViewModel {
  analysisId: number | null;
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  roast: string;
  advice: string[];
}

export interface AnalysisHistoryItem {
  id: number;
  user_id: number | null;
  ats_score: number;
  missing_skills: string[];
  created_at: string;
}

export interface AnalysisDetailResponse extends AnalysisHistoryItem {
  feedback_data: {
    roast?: string;
    advice?: string[];
    matched_skills?: string[];
  };
}

export interface AnalysesHistoryResponse {
  count: number;
  history: AnalysisHistoryItem[];
}

export interface RewriteSummary {
  id: number;
  style: RewriteStyle;
  created_at: string;
  html_length: number;
}

export interface RewritesResponse {
  analysis_id: number;
  count: number;
  rewrites: RewriteSummary[];
}

export interface RewriteDownloadResponse {
  id: number;
  analysis_id: number | null;
  style: RewriteStyle;
  created_at: string;
  html_content: string;
  original_text: string | null;
}

export interface DiffState {
  analysisId: number;
  rewriteId: number;
  originalText: string;
  newHtml: string;
  targetStyle: RewriteStyle;
}
