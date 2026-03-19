import type { AnalysisViewModel } from '../types';

interface ScoreDashboardProps {
  analysis: AnalysisViewModel | null;
}

export function ScoreDashboard({ analysis }: ScoreDashboardProps) {
  if (!analysis) {
    return (
      <section className="card">
        <h2>Score Dashboard</h2>
        <p className="muted">Analyze a resume to view ATS score, feedback, and action plan.</p>
      </section>
    );
  }

  return (
    <section className="score-layout">
      <article className="card score-card">
        <h2>ATS Score</h2>
        <p className="score-value">{analysis.atsScore}%</p>
        <div className="meter">
          <div className="meter-fill" style={{ width: `${analysis.atsScore}%` }} />
        </div>
      </article>

      <article className="card">
        <h2>Recruiter Roast</h2>
        <p className="roast-box">{analysis.roast}</p>
      </article>

      <article className="card">
        <h2>Action Plan</h2>
        <ul className="plain-list">
          {analysis.advice.map((tip, index) => (
            <li key={`${tip}-${index}`}>{tip}</li>
          ))}
        </ul>
      </article>

      <article className="card">
        <h2>Skills Coverage</h2>
        <p className="subheading">Matched Skills</p>
        <div className="chip-wrap">
          {analysis.matchedSkills.length === 0 ? <span className="muted">None</span> : null}
          {analysis.matchedSkills.map((skill) => (
            <span className="chip chip-hit" key={skill}>{skill}</span>
          ))}
        </div>

        <p className="subheading">Missing Skills</p>
        <div className="chip-wrap">
          {analysis.missingSkills.length === 0 ? <span className="muted">None</span> : null}
          {analysis.missingSkills.map((skill) => (
            <span className="chip chip-miss" key={skill}>{skill}</span>
          ))}
        </div>
      </article>
    </section>
  );
}
