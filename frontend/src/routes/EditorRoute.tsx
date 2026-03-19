import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import { ChameleonEditor } from '../components/ChameleonEditor';
import { downloadRewriteById } from '../lib/api';
import type { DiffState } from '../types';

export function EditorRoute() {
  const { rewriteId } = useParams();
  const parsedRewriteId = useMemo(() => Number(rewriteId), [rewriteId]);

  const [diffState, setDiffState] = useState<DiffState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!Number.isFinite(parsedRewriteId)) {
        setError('Invalid rewrite ID.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const payload = await downloadRewriteById(parsedRewriteId);
        setDiffState({
          analysisId: payload.analysis_id ?? 0,
          rewriteId: payload.id,
          originalText: payload.original_text || '',
          newHtml: payload.html_content,
          targetStyle: payload.style,
        });
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to load rewrite.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [parsedRewriteId]);

  return (
    <section className="route-stack">
      <article className="card">
        <div className="section-head">
          <h2>Editor</h2>
          <div className="inline-controls">
            <Link className="ghost-link" to="/history">History</Link>
            {diffState?.analysisId ? (
              <Link className="ghost-link" to={`/dashboard/${diffState.analysisId}`}>Dashboard</Link>
            ) : null}
          </div>
        </div>
        <p className="muted">Rewrite ID: {rewriteId}</p>
        {error ? <p className="error-text">{error}</p> : null}
      </article>

      <ChameleonEditor
        diffState={diffState}
        isLoading={isLoading}
        onHtmlChange={(html) => {
          setDiffState((prev) => (prev ? { ...prev, newHtml: html } : prev));
        }}
      />
    </section>
  );
}
