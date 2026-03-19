import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ScoreDashboard } from '../components/ScoreDashboard';
import { getAnalysisById, getRewritesForAnalysis, rewriteFromAnalysis } from '../lib/api';
import type { AnalysisViewModel, RewriteStyle, RewriteSummary } from '../types';

interface DashboardLocationState {
  analysis?: AnalysisViewModel;
}

export function DashboardRoute() {
  const navigate = useNavigate();
  const { analysisId } = useParams();
  const location = useLocation();
  const locationState = location.state as DashboardLocationState | null;

  const parsedId = useMemo(() => Number(analysisId), [analysisId]);

  const [analysis, setAnalysis] = useState<AnalysisViewModel | null>(locationState?.analysis ?? null);
  const [rewrites, setRewrites] = useState<RewriteSummary[]>([]);
  const [rewriteStyle, setRewriteStyle] = useState<RewriteStyle>('standard');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!Number.isFinite(parsedId)) {
      setError('Invalid analysis ID.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [analysisPayload, rewritePayload] = await Promise.all([
        getAnalysisById(parsedId),
        getRewritesForAnalysis(parsedId).catch(() => ({ analysis_id: parsedId, count: 0, rewrites: [] })),
      ]);

      const feedback = analysisPayload.feedback_data || {};
      setAnalysis({
        analysisId: analysisPayload.id,
        atsScore: analysisPayload.ats_score,
        matchedSkills: Array.isArray(feedback.matched_skills) ? feedback.matched_skills : [],
        missingSkills: analysisPayload.missing_skills || [],
        roast: typeof feedback.roast === 'string' ? feedback.roast : 'No roast stored.',
        advice: Array.isArray(feedback.advice) ? feedback.advice : [],
      });

      setRewrites(rewritePayload.rewrites);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load analysis.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const generateRewrite = async () => {
    if (!Number.isFinite(parsedId)) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const payload = await rewriteFromAnalysis(parsedId, rewriteStyle);
      await loadDashboard();
      if (payload.rewrite_id) {
        navigate(`/editor/${payload.rewrite_id}`);
      }
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : 'Rewrite generation failed.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="route-stack">
      <article className="card">
        <div className="section-head">
          <h2>Dashboard</h2>
          <div className="inline-controls">
            <Link className="ghost-link" to="/">New Roast</Link>
            <Link className="ghost-link" to="/history">History</Link>
          </div>
        </div>
        <p className="muted">Analysis ID: {analysisId}</p>
        {error ? <p className="error-text">{error}</p> : null}
      </article>

      {isLoading ? (
        <article className="card">
          <p className="muted">Loading dashboard...</p>
        </article>
      ) : null}
      {!isLoading ? <ScoreDashboard analysis={analysis} /> : null}

      <article className="card">
        <div className="section-head">
          <h2>Generate New Rewrite</h2>
          <div className="inline-controls">
            <select
              className="style-select"
              value={rewriteStyle}
              onChange={(event) => setRewriteStyle(event.target.value as RewriteStyle)}
            >
              <option value="standard">Standard ATS</option>
              <option value="modern">Startup Modern</option>
              <option value="executive">Executive</option>
            </select>
            <button className="primary-btn" type="button" onClick={generateRewrite} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Build Rewrite'}
            </button>
          </div>
        </div>
      </article>

      <article className="card">
        <h2>Linked Rewrites</h2>
        <div className="history-list">
          {rewrites.map((rewrite) => (
            <Link key={rewrite.id} className="history-item" to={`/editor/${rewrite.id}`}>
              <span>Rewrite #{rewrite.id}</span>
              <span>{rewrite.style}</span>
              <span>{new Date(rewrite.created_at).toLocaleString()}</span>
            </Link>
          ))}
          {rewrites.length === 0 ? <p className="muted">No rewrites yet for this analysis.</p> : null}
        </div>
      </article>
    </section>
  );
}
