# The Ambient Confidant Web Playground

An interactive, local Web Playground designed to visualize, test, and analyze the architectural shift from cold, transactional **Oracle AI** systems to high-EQ, validation-first **Confidant AI** systems. 

This playground acts as a direct companion to the book: *The Ambient Confidant: Designing Emotional Intelligence for Native Multimodal & Agentic AI*.

---

## 🚀 Key Features
1. **Interactive Chapter Sidebar:** Select and test case studies from all seven chapters (e.g., Grocery Checkout Card Declines, Panicked Boarding Card Loss, CFO Wire Shutdowns, and Remittance Oncology Crises).
2. **Dual-Pane Terminal Live Streaming:** Run user prompts concurrently and watch the outputs from both the Oracle (Level 1) and the Confidant (Level 4/5) stream side-by-side in real-time.
3. **Interactive JSON Memory Graph Editor:** Edit the active crises, traps, and victories in real-time, click "Save Graph Context", and witness how the Confidant dynamically performs victory call-backs.
4. **Socratic Mode Toggle (Answer Ban):** Enable Socratic constraints to force the Confidant to withhold the final solution and ask strategic, learning-oriented queries.
5. **Lexical Banned-Phrase Scanner:** Inspect the banned word indices for each chapter in real-time. Triggered terms automatically light up red as the tokens are parsed.
6. **"I Give Up" Escape Hatch:** Click the trigger button to simulate extreme user frustration and watch the Confidant bypass the Socratic loop to execute emergency compliance hand-offs.
7. **Chain-of-Thought Inspector:** View the Confidant's hidden `<internal_monologue>` sequence as it runs state inferences and validation checks.
8. **Direct Ollama Integration:** Communicates locally with your Ollama server. No external API keys or subscription fees required.

---

## 🛠️ Prerequisites

To run this playground, you need **Ollama** installed on your computer along with the **Gemma3 1B** model.

### 1. Download & Install Ollama
* **macOS:** Download the app from [ollama.com/download](https://ollama.com/download) and drag it to your Applications folder.
* **Windows:** Download and run the installer from [ollama.com/download](https://ollama.com/download).

### 2. Pull the Gemma3 Model
Open your **Terminal** (macOS) or **Command Prompt/PowerShell** (Windows) and run:
```bash
ollama pull gemma3:1b
```
*(You can also use other models such as `gemma3` (4B) or `llama3.2`, which can be selected inside the playground UI).*

---

## 💻 How to Start the Playground

To bypass browser security limits (CORS blocks) when connecting local web pages to local server APIs, you should run a simple local web server. Python is pre-installed on macOS and is a simple one-click install on Windows.

### On macOS / Linux:
1. Open the project folder in Finder.
2. Double-click the **`run.sh`** script file.
3. Open your browser and go to: **[http://localhost:8000](http://localhost:8000)**

*(Alternatively, run `python3 -m http.server 8000` inside the project directory in your Terminal).*

### On Windows:
1. Open the project folder in File Explorer.
2. Double-click the **`run.bat`** batch file.
3. Open your browser and go to: **[http://localhost:8000](http://localhost:8000)**

*(Alternatively, run `python -m http.server 8000` in Command Prompt/PowerShell inside the project directory).*

---

## ⚠️ Troubleshooting (CORS Issues)

If the playground shows **Ollama Status: Offline** and you're sure Ollama is active, the browser is blocking cross-origin requests. You can easily fix this by restarting Ollama with CORS origins enabled:

### For macOS:
1. Quit Ollama from the menu bar.
2. Open **Terminal** and run:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```
3. Refresh the playground page.

### For Windows:
1. Right-click the Ollama icon in the system tray and select **Quit**.
2. Open **PowerShell** and run:
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ollama serve
   ```
3. Refresh the playground page.

---

## 📂 Project Directory Structure
* **`index.html`** - Main interface structure with side-by-side terminal streams.
* **`index.css`** - Custom dark mode, glassmorphic layout, and scorecard animations.
* **`app.js`** - Core controller: handles streaming connection, token checks, XML parsing, and scorecard heuristics.
* **`prompts.js`** - Client-side database holding all chapter scenario data.
* **`prompts/`** - Raw text files for each chapter's prompt instructions:
  - `ch1_oracle.txt` / `ch1_confidant.txt` - Validation-First Protocol
  - `ch2_oracle.txt` / `ch2_confidant.txt` - Vocal Pacing & Prosody
  - `ch3_oracle.txt` / `ch3_confidant.txt` - Somatic Metaphors & Lexical Banishment
  - `ch4_oracle.txt` / `ch4_confidant.txt` - Memory Graphs & Victory Call-backs
  - `ch5_oracle.txt` / `ch5_confidant.txt` - Co-Present Narration & Socratic pivots
  - `ch6_oracle.txt` / `ch6_confidant.txt` - Parasocial Prevention & Safety Off-ramps
  - `ch7_oracle.txt` / `ch7_confidant.txt` - Outage Cognitive Load Minimization
* **`run.sh` / `run.bat`** - Startup launchers.
