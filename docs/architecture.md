# High-Level Architecture

ResumeAI operates on a lightweight, decoupled Client-Server architecture.

## 1. Presentation Layer (Client)
* **File:** `index.html`
* **Responsibilities:** * Handle drag-and-drop file uploads.
  * Manage asynchronous fetch requests to the backend.
  * Execute regex parsing to separate the AI's raw text into distinct UI components (Roast Box, Advice List).
  * Render and sanitize dynamic HTML returned by the Architect agent.

## 2. Application Layer (Server)
* **File:** `main.py`
* **Responsibilities:**
  * Accept HTTP POST requests via FastAPI.
  * Extract raw text from PDF binaries securely.
  * Inject extracted text into highly constrained LLM prompts.
  * Route requests between the "Roaster" prompt and the "Architect" prompt.

## 3. Intelligence Layer (AI Agent)
* **Component:** Hugging Face Inference API.
* **Responsibilities:**
  * Natural Language Processing.
  * Persona adoption (Mean Recruiter vs. Professional Writer).
  * Code Generation (HTML/CSS creation for the Chameleon Architect).
