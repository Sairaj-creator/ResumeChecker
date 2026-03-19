import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getRecentAnalyses, getRewritesForAnalysis } from '../lib/api';
import { formatDate } from '../lib/formatters';
import type { AnalysisHistoryItem, RewriteSummary } from '../types';

export function HistoryPanel() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [rewrites, setRewrites] = useState<RewriteSummary[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRewrites, setIsLoadingRewrites] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await getRecentAnalyses(15);
      setAnalyses(payload.history);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to fetch history.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadRewrites = async (analysisId: number) => {
    setActiveAnalysisId(analysisId);
    setIsLoadingRewrites(true);
    setError(null);

    try {
      const payload = await getRewritesForAnalysis(analysisId);
      setRewrites(payload.rewrites);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unable to fetch rewrites.';
      setError(message);
      setRewrites([]);
    } finally {
      setIsLoadingRewrites(false);
    }
  };

  return (
    <section className="card history-card">
      <div className="section-head">
        <h2>History Panel</h2>
        <div className="inline-controls">
          <button className="ghost-btn" onClick={loadAnalyses} type="button">Refresh</button>
          <Link className="ghost-link" to="/">New Roast</Link>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="history-grid">
        <div>
          <p className="subheading">Recent Analyses</p>
          {isLoading ? <p className="muted">Loading analyses...</p> : null}
          <div className="history-list">
            {analyses.map((analysis) => (
              <div key={analysis.id} className={`history-item ${activeAnalysisId === analysis.id ? 'active' : ''}`}>
                <button type="button" className="history-select" onClick={() => loadRewrites(analysis.id)}>
                  <span>Analysis #{analysis.id}</span>
                  <span>ATS {analysis.ats_score}%</span>
                  <span>{formatDate(analysis.created_at)}</span>
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => navigate(`/dashboard/${analysis.id}`)}
                >
                  Open Dashboard
                </button>
              </div>
            ))}
            {!isLoading && analyses.length === 0 ? <p className="muted">No saved analyses yet.</p> : null}
          </div>
        </div>

        <div>
          <p className="subheading">Rewrites for Selected Analysis</p>
          {isLoadingRewrites ? <p className="muted">Loading rewrites...</p> : null}
          <div className="history-list">
            {rewrites.map((rewrite) => (
              <button
                key={rewrite.id}
                className="history-item"
                onClick={() => navigate(`/editor/${rewrite.id}`)}
                type="button"
              >
                <span>Rewrite #{rewrite.id}</span>
                <span>{rewrite.style}</span>
                <span>{formatDate(rewrite.created_at)}</span>
              </button>
            ))}
            {!isLoadingRewrites && rewrites.length === 0 ? (
              <p className="muted">Select an analysis to view rewrites.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
