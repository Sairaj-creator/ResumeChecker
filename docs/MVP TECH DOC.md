# MVP Technical Documentation

## 1. Tech Stack
* **Frontend:** Vanilla HTML5, CSS3 (CSS Grid/Flexbox, CSS Variables), Vanilla JavaScript.
* **Backend:** Python 3.x, FastAPI (running on Uvicorn).
* **AI Provider:** Hugging Face API (Inference endpoints).
* **PDF Processing:** `PyPDF2` or `pdfplumber` (Python).

## 2. API Endpoints

### `POST /analyze`
* **Purpose:** Generates the roast, ATS score, missing skills, and advice.
* **Payload:** `multipart/form-data` (File upload: `.pdf`).
* **Response:** JSON
  ```json
  {
    "ats_score": 45,
    "missing_skills": ["docker", "aws"],
    "roast_and_advice": "[ROAST] You code in C but your resume looks like it was built in MS Paint.\n[ADVICE]\n> Stop listing high school.\n> Use the STAR method."
  }

```

### `POST /rewrite`

* **Purpose:** Rebuilds the resume into HTML based on a selected style.
* **Payload:** `multipart/form-data` (File upload: `.pdf`), Query Parameter `style` (standard | modern | executive).
* **Response:** JSON
```json
{
  "html_resume": "<div class='resume-header'>...</div>"
}

```



## 3. Known Limitations (MVP)

* Token limits on free Hugging Face API tiers may truncate long resumes.
* LLM HTML generation can occasionally include markdown backticks (```html) requiring frontend sanitization.
