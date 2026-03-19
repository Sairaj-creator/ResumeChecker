import type { DiffState } from '../types';

interface ChameleonEditorProps {
  diffState: DiffState | null;
  isLoading: boolean;
  onHtmlChange: (html: string) => void;
}

export function ChameleonEditor({ diffState, isLoading, onHtmlChange }: ChameleonEditorProps) {
  if (isLoading) {
    return (
      <section className="card editor-card">
        <h2>Chameleon Editor</h2>
        <p className="muted">Loading rewrite...</p>
      </section>
    );
  }

  if (!diffState) {
    return (
      <section className="card editor-card">
        <h2>Chameleon Editor</h2>
        <p className="muted">Open a rewrite from History to edit and compare.</p>
      </section>
    );
  }

  return (
    <section className="card editor-card">
      <div className="section-head">
        <h2>Chameleon Editor</h2>
        <div className="editor-meta">
          <span>Analysis #{diffState.analysisId}</span>
          <span>Rewrite #{diffState.rewriteId}</span>
          <span>{diffState.targetStyle}</span>
        </div>
      </div>

      <div className="editor-grid editor-grid-three">
        <div>
          <p className="subheading">Original Text (Before)</p>
          <textarea
            className="code-editor"
            value={diffState.originalText}
            readOnly
          />
        </div>

        <div>
          <p className="subheading">Edited HTML (After)</p>
          <textarea
            className="code-editor"
            value={diffState.newHtml}
            onChange={(event) => onHtmlChange(event.target.value)}
          />
        </div>

        <div>
          <p className="subheading">Live Preview</p>
          <iframe title="resume-preview" className="preview-frame" srcDoc={diffState.newHtml || '<p>No content yet.</p>'} />
        </div>
      </div>
    </section>
  );
}
