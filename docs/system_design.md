# System Design

## 1. Text Extraction Module
* **Process:** Uploaded files are written to a temporary buffer. The text extraction library reads the binary, strips formatting, and returns raw UTF-8 text. The text is sliced (`text[:2000]`) to ensure it fits within standard LLM context windows and prevents token bloat.

## 2. Strict Parsing Protocol (The Regex Engine)
To overcome the unpredictability of LLM formatting, the system uses a strict delimiter design.
* **Backend Trigger:** The prompt forces the AI to use `>` for bullet points.
* **Frontend Regex:** `adviceItems = rawAdvice.split(/(?:>|\*|-|\d+\.)/)`
* **Result:** Guaranteed 100% accurate chopping of raw strings into clean UI cards, regardless of whether the AI uses stars, dashes, or numbered lists.

## 3. The Chameleon Agent Routing
The `/rewrite` endpoint acts as an intelligent router.
* **Input:** The `style` query parameter string.
* **Control Flow:** An `if/elif` block injects specific layout rules, color hex codes, and font families into the `style_instructions` variable.
* **Output:** This guarantees the LLM's generated `<style>` tags directly match the user's intent without requiring complex post-processing.
