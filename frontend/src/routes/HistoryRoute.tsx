import { Link } from 'react-router-dom';

import { HistoryPanel } from '../components/HistoryPanel';

export function HistoryRoute() {
  return (
    <section className="route-stack">
      <article className="card">
        <div className="section-head">
          <h2>My History</h2>
          <Link className="ghost-link" to="/">New Roast</Link>
        </div>
        <p className="muted">Browse previous analyses and open rewrite sessions in the editor.</p>
      </article>
      <HistoryPanel />
    </section>
  );
}
