# KeyResume

Professional resume analyzer and AI resume rewriter built with FastAPI + HTML/CSS/JS.

## Run with Docker (recommended)

1. Configure environment values in `.env`.
2. Start services:

```bash
docker compose up --build
```

3. Run database migrations:

```bash
docker compose exec api alembic upgrade head
```

4. Open the app at [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Run without Docker

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Configure `.env` with `DATABASE_URL` and optional `HF_TOKEN`.

3. Apply migrations:

```bash
alembic upgrade head
```

4. Start server:

```bash
uvicorn main:app --reload
```

## Week 2 Frontend (React + TypeScript + Router)

1. Move into frontend app:

```bash
cd frontend
```

2. Create `.env` from `.env.example` and set API base URL if needed.

3. Start dev server:

```bash
npm install
npm run dev
```

4. Build + lint:

```bash
npm run build
npm run lint
```

### Frontend routes

- `/` New Roast uploader
- `/dashboard/:analysisId` analysis results
- `/history` saved analysis/rewrite history
- `/editor/:rewriteId` live HTML editor + before/after state

## Backend Endpoints

- `GET /` legacy MVP frontend
- `GET /health` health and AI mode
- `POST /analyze` ATS score + feedback + persist analysis
- POST /rewrite?style=standard|modern|executive&analysis_id=<id> generate HTML + persist rewrite
- POST /rewrite/from-analysis/{analysis_id}?style=standard|modern|executive generate rewrite from stored analysis text
- `GET /history/analyses?limit=10&user_id=<optional>` recent analyses
- `GET /history/analyses/{analysis_id}` single analysis detail
- `GET /history/rewrites/{analysis_id}` rewrite summaries for analysis
- `GET /history/rewrites/{analysis_id}/download/{rewrite_id}` rewrite payload + original text
- `GET /history/rewrites/download/{rewrite_id}` rewrite payload by rewrite id (editor route)

