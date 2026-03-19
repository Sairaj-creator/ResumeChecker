import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';

import { DashboardRoute } from './routes/DashboardRoute';
import { EditorRoute } from './routes/EditorRoute';
import { HistoryRoute } from './routes/HistoryRoute';
import { NewRoastRoute } from './routes/NewRoastRoute';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="navbar">
          <div className="logo">ResumeAI</div>
          <div className="nav-links">
            <Link to="/">New Roast</Link>
            <Link to="/history">My History</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<NewRoastRoute />} />
            <Route path="/dashboard/:analysisId" element={<DashboardRoute />} />
            <Route path="/history" element={<HistoryRoute />} />
            <Route path="/editor/:rewriteId" element={<EditorRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
