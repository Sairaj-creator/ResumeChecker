import type {
  AnalysesHistoryResponse,
  AnalysisDetailResponse,
  AnalysisResponse,
  RewriteDownloadResponse,
  RewritesResponse,
  RewriteResponse,
  RewriteStyle,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${input}`, init);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function analyzeResume(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson<AnalysisResponse>('/analyze', {
    method: 'POST',
    body: formData,
  });
}

export async function rewriteResume(
  file: File,
  style: RewriteStyle,
  analysisId?: number | null,
): Promise<RewriteResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const query = new URLSearchParams({ style });
  if (analysisId) {
    query.set('analysis_id', String(analysisId));
  }

  return requestJson<RewriteResponse>(`/rewrite?${query.toString()}`, {
    method: 'POST',
    body: formData,
  });
}

export async function rewriteFromAnalysis(
  analysisId: number,
  style: RewriteStyle,
): Promise<RewriteResponse> {
  return requestJson<RewriteResponse>(
    `/rewrite/from-analysis/${analysisId}?style=${encodeURIComponent(style)}`,
    { method: 'POST' },
  );
}

export async function getRecentAnalyses(limit = 10): Promise<AnalysesHistoryResponse> {
  return requestJson<AnalysesHistoryResponse>(`/history/analyses?limit=${limit}`);
}

export async function getAnalysisById(analysisId: number): Promise<AnalysisDetailResponse> {
  return requestJson<AnalysisDetailResponse>(`/history/analyses/${analysisId}`);
}

export async function getRewritesForAnalysis(analysisId: number): Promise<RewritesResponse> {
  return requestJson<RewritesResponse>(`/history/rewrites/${analysisId}`);
}

export async function downloadRewriteById(rewriteId: number): Promise<RewriteDownloadResponse> {
  return requestJson<RewriteDownloadResponse>(`/history/rewrites/download/${rewriteId}`);
}
