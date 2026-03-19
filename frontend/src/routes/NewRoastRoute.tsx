import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { ResumeUploader } from '../components/ResumeUploader';
import { analyzeResume } from '../lib/api';
import { parseFeedback } from '../lib/formatters';
import type { AnalysisViewModel } from '../types';

export function NewRoastRoute() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Upload a resume and run your first roast.');

  const handleAnalyze = async () => {
    if (!selectedFile) {
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage('Analyzing resume...');

    try {
      const payload = await analyzeResume(selectedFile);
      if (!payload.analysis_id) {
        throw new Error('Analysis was generated but not persisted. Check database connectivity.');
      }

      const parsed = parseFeedback(payload.roast_and_advice);
      const analysis: AnalysisViewModel = {
        analysisId: payload.analysis_id,
        atsScore: payload.ats_score,
        matchedSkills: payload.matched_skills,
        missingSkills: payload.missing_skills,
        roast: parsed.roast,
        advice: parsed.advice,
      };

      navigate(`/dashboard/${payload.analysis_id}`, { state: { analysis } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Analysis failed.';
      setStatusMessage(`Error: ${message}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="route-stack">
      <article className="card">
        <h2>New Roast</h2>
        <p className="muted">Start with a PDF upload, then jump straight to dashboard results.</p>
        <p className="status-banner compact">{statusMessage}</p>
        <p className="muted">Need old runs? <Link to="/history">Open history</Link>.</p>
      </article>

      <ResumeUploader
        selectedFile={selectedFile}
        isAnalyzing={isAnalyzing}
        onFileSelected={setSelectedFile}
        onAnalyze={handleAnalyze}
      />
    </section>
  );
}
