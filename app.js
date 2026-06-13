// The Ambient Confidant Playground - Core Javascript Application (app.js - Final Upgraded)

// 1. State Management
let currentChapter = 1;
let activeMaturityLevel = 5; // Default Level 5 (Continuous Memory)
let isGenerating = false;
let ollamaModels = [];
let activeMemoryGraph = {};
let oracleHistory = [];
let confidantHistory = [];

// Local disk prompts cache (source of truth)
let diskOraclePrompts = {};
let diskConfidantPrompts = {};

// DOM Elements
const chapterList = document.getElementById('chapter-list');
const chapterBadge = document.getElementById('chapter-badge');
const chapterTitle = document.getElementById('chapter-title');
const chapterSubtitle = document.getElementById('chapter-subtitle');
const chapterPmValue = document.getElementById('chapter-pm-value');
const scenarioTitle = document.getElementById('scenario-title');
const scenarioDesc = document.getElementById('scenario-desc');
const userPromptInput = document.getElementById('user-prompt');
const btnRun = document.getElementById('btn-run');
const btnResetPrompt = document.getElementById('btn-reset-prompt');

// Advanced Control Elements
const memoryGraphEditor = document.getElementById('memory-graph-editor');
const memoryGraphOverlay = document.getElementById('memory-graph-overlay');
const btnSaveGraph = document.getElementById('btn-save-graph');
const toggleSocratic = document.getElementById('toggle-socratic');
const btnGiveUp = document.getElementById('btn-give-up');
const bannedWordsTags = document.getElementById('banned-words-tags');

// Terminal Elements
const oracleOutputPane = document.getElementById('oracle-chat-feed');
const oracleStatus = document.getElementById('oracle-status');
const oracleTokenCount = document.getElementById('oracle-token-count');
const oracleLatency = document.getElementById('oracle-latency');
const oracleScorecard = document.getElementById('oracle-scorecard');
const oracleSystemPrompt = document.getElementById('oracle-system-prompt');
const oracleMaturity = document.getElementById('oracle-maturity');
const oracleGraderStatus = document.getElementById('oracle-grader-status');

const confidantChatFeed = document.getElementById('confidant-chat-feed');
const confidantOutputPane = document.getElementById('confidant-output-feed');
const confidantStatus = document.getElementById('confidant-status');
const confidantTokenCount = document.getElementById('confidant-token-count');
const confidantLatency = document.getElementById('confidant-latency');
const confidantScorecard = document.getElementById('confidant-scorecard');
const confidantSystemPrompt = document.getElementById('confidant-system-prompt');
const confidantMonologuePane = document.getElementById('confidant-monologue-pane');
const confidantMonologueText = document.getElementById('confidant-monologue-text');
const toggleMonologue = document.getElementById('toggle-monologue');
const confidantMaturity = document.getElementById('confidant-maturity');
const confidantTitleText = document.getElementById('confidant-title-text');
const confidantAsymmetryRatio = document.getElementById('confidant-asymmetry-ratio');
const confidantGraderStatus = document.getElementById('confidant-grader-status');

// Speech Elements
const btnSpeakOracle = document.getElementById('btn-speak-oracle');
const btnSpeakConfidant = document.getElementById('btn-speak-confidant');
const oracleSpeechGroup = document.getElementById('oracle-speech-group');
const speechGroup = document.getElementById('speech-group');

// ROI Calculator Elements
const navRoiCalc = document.getElementById('nav-roi-calc');
const playgroundView = document.getElementById('playground-view');
const roiWorkspaceView = document.getElementById('roi-workspace-view');
const inputMau = document.getElementById('input-mau');
const inputAbandon = document.getElementById('input-abandon');
const inputArpu = document.getElementById('input-arpu');
const valMau = document.getElementById('val-mau');
const valAbandon = document.getElementById('val-abandon');
const valArpu = document.getElementById('val-arpu');
const valUsersRecovered = document.getElementById('val-users-recovered');
const valArrRecovered = document.getElementById('val-arr-recovered');

// Auto-Pilot & Telemetry Elements
const btnAutoPilot = document.getElementById('btn-auto-pilot');
const confidantTelemetryPanel = document.getElementById('confidant-telemetry-panel');
const telemetryArousal = document.getElementById('telemetry-arousal');
const telemetryFocus = document.getElementById('telemetry-focus');
const telemetryParasocial = document.getElementById('telemetry-parasocial');
const telemetrySafety = document.getElementById('telemetry-safety');

let isAutoPilotActive = false;

// Settings Elements
const ollamaUrlInput = document.getElementById('ollama-url');
const ollamaModelSelect = document.getElementById('ollama-model');
const connectionStatus = document.getElementById('connection-status');
const btnReconnect = document.getElementById('btn-reconnect');
const connectionAlert = document.getElementById('connection-alert');

// 2. Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  loadChapter(1);
  checkOllamaConnection();
  setupMaturityTabs();
  
  // Event Listeners
  btnRun.addEventListener('click', () => runComparison(false));
  btnGiveUp.addEventListener('click', triggerGiveUpEscapeHatch);
  btnResetPrompt.addEventListener('click', resetToDefaultPrompt);
  btnReconnect.addEventListener('click', checkOllamaConnection);
  btnSaveGraph.addEventListener('click', saveMemoryGraphContext);
  
  toggleMonologue.addEventListener('change', (e) => {
    if (e.target.checked && confidantMonologueText.textContent.trim() !== '') {
      confidantMonologuePane.classList.remove('hidden');
    } else {
      confidantMonologuePane.classList.add('hidden');
    }
  });

  toggleSocratic.addEventListener('change', () => {
    const data = chapterData.find(ch => ch.chapter === currentChapter);
    if (data) updatePromptInspectors(data);
  });

  // ROI Slider Listeners
  inputMau.addEventListener('input', updateRoiCalculations);
  inputAbandon.addEventListener('input', updateRoiCalculations);
  inputArpu.addEventListener('input', updateRoiCalculations);
  
  // Navigation for ROI Calculator
  navRoiCalc.addEventListener('click', () => {
    if (isGenerating) return;
    showRoiCalculator();
  });
  
  // Speech listeners
  btnSpeakOracle.addEventListener('click', () => {
    const lastOracleMsg = [...oracleHistory].reverse().find(m => m.role === 'assistant');
    if (lastOracleMsg) speakText(lastOracleMsg.content, false);
  });
  btnSpeakConfidant.addEventListener('click', () => {
    const lastConfMsg = [...confidantHistory].reverse().find(m => m.role === 'assistant');
    if (lastConfMsg) speakText(lastConfMsg.content, true);
  });
  
  // Reset chat listener
  const btnResetChat = document.getElementById('btn-reset-chat');
  btnResetChat.addEventListener('click', () => {
    oracleHistory = [];
    confidantHistory = [];
    resetOutputs();
    const data = chapterData.find(ch => ch.chapter === currentChapter);
    if (data) renderInitialScorecards(data);
  });

  // Auto-pilot listener
  btnAutoPilot.addEventListener('click', () => {
    if (isGenerating || isAutoPilotActive) return;
    runAutoPilot();
  });
});

// Speech Synthesis Helper
function speakText(text, isConfidant) {
  if (!window.speechSynthesis) {
    alert("Web Speech API not supported in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  
  const cleanText = text.replace(/<[^>]+>/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  if (isConfidant) {
    utterance.pitch = 0.8;
    utterance.rate = 0.72;
  } else {
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
  }
  window.speechSynthesis.speak(utterance);
}

// ROI Calculations
function updateRoiCalculations() {
  const mau = parseFloat(inputMau.value);
  const abandon = parseFloat(inputAbandon.value);
  const arpu = parseFloat(inputArpu.value);
  
  valMau.textContent = mau.toLocaleString();
  valAbandon.textContent = `${abandon}%`;
  valArpu.textContent = `$${arpu}`;
  
  const abandonRate = abandon / 100;
  const usersRecovered = Math.round(mau * (abandonRate * 0.15));
  const arrRecovered = Math.round(usersRecovered * arpu * 12);
  
  valUsersRecovered.textContent = `${usersRecovered.toLocaleString()} / mo`;
  valArrRecovered.textContent = `$${arrRecovered.toLocaleString()}`;
}


// Switch view to ROI Calculator
function showRoiCalculator() {
  playgroundView.classList.add('hidden');
  roiWorkspaceView.classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  navRoiCalc.classList.add('active');
  
  updateRoiCalculations();
}

// ==========================================================================
// 8. Auto-Pilot & Telemetry Helpers
// ==========================================================================
function typeText(text, callback) {
  userPromptInput.value = '';
  let i = 0;
  const timer = setInterval(() => {
    if (i < text.length) {
      userPromptInput.value += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
      setTimeout(callback, 500);
    }
  }, 20);
}

function updateTelemetryGauges(monologueText, visibleResponseText = '') {
  if (activeMaturityLevel < 5) {
    confidantTelemetryPanel.classList.remove('hidden');
    telemetryArousal.textContent = "Offline (L5 Required)";
    telemetryArousal.className = "telemetry-val";
    telemetryFocus.textContent = "N/A";
    telemetryParasocial.textContent = "N/A";
    telemetryParasocial.className = "telemetry-val";
    telemetrySafety.textContent = "N/A";
    telemetrySafety.className = "telemetry-val";
    return;
  }

  confidantTelemetryPanel.classList.remove('hidden');

  let textLower = (monologueText || '').toLowerCase();
  if (!textLower) {
    const lastUserMsg = [...confidantHistory].reverse().find(m => m.role === 'user');
    textLower = ((lastUserMsg ? lastUserMsg.content : '') + ' ' + (visibleResponseText || '')).toLowerCase();
  }

  // 1. Parse Arousal / Stress Level
  let arousal = "Grounded";
  let arousalClass = "arousal-low";
  
  if (textLower.includes("high-arousal") || textLower.includes("arousal: high") || textLower.includes("stress indicator: high") || textLower.includes("academic shame") || textLower.includes("panic") || textLower.includes("burnout")) {
    arousal = "Escalated (High)";
    arousalClass = "arousal-high";
  } else if (textLower.includes("medium-arousal") || textLower.includes("arousal: medium") || textLower.includes("stress indicator: medium") || textLower.includes("de-escalat")) {
    arousal = "Paced (Medium)";
    arousalClass = "arousal-medium";
  } else if (textLower.includes("low-arousal") || textLower.includes("arousal: low") || textLower.includes("stress indicator: low") || textLower.includes("grounded") || textLower.includes("calm")) {
    arousal = "Grounded (Low)";
    arousalClass = "arousal-low";
  } else {
    if (currentChapter === 1 || currentChapter === 2 || currentChapter === 6 || currentChapter === 8) {
      arousal = "Escalated (High)";
      arousalClass = "arousal-high";
    } else if (currentChapter === 3 || currentChapter === 4 || currentChapter === 5) {
      arousal = "Paced (Medium)";
      arousalClass = "arousal-medium";
    }
  }
  telemetryArousal.textContent = arousal;
  telemetryArousal.className = `telemetry-val ${arousalClass}`;

  // 2. Stress Focus / Validation Target
  let focus = "None Detected";
  const focusMatches = (monologueText || '').match(/(?:validation target|double bind|stress focus|crises)\s*[:=-]\s*([^\n\r]+)/i);
  if (focusMatches && focusMatches[1]) {
    focus = focusMatches[1].trim().replace(/[()[\]{}*]/g, '');
    if (focus.length > 30) focus = focus.substring(0, 28) + "...";
  } else {
    const defaults = {
      1: "Card block at queue",
      2: "Stolen card / flight gate",
      3: "CFO wire logistics delay",
      4: "Mother's oncology therapy",
      5: "SVB to Chase sweep",
      6: "Stranded off-grid Patagonia",
      7: "Server-3 thread lock",
      8: "Midterm calculus dropout"
    };
    focus = defaults[currentChapter] || "Friction Alert";
  }
  telemetryFocus.textContent = focus;

  // 3. Parasocial Risk
  let parasocial = "Low";
  let parasocialClass = "risk-none";
  if (textLower.includes("parasocial risk: high") || textLower.includes("severe dependency") || textLower.includes("dependency: high") || textLower.includes("unhealthy dependency") || textLower.includes("favored person")) {
    parasocial = "Severe";
    parasocialClass = "risk-severe";
  } else if (textLower.includes("parasocial risk: medium") || textLower.includes("dependency: medium") || textLower.includes("parasocial risk") || textLower.includes("dependency check")) {
    parasocial = "Elevated";
    parasocialClass = "risk-elevated";
  }
  telemetryParasocial.textContent = parasocial;
  telemetryParasocial.className = `telemetry-val ${parasocialClass}`;

  // 4. Safety Containment
  let safety = "Secured";
  let safetyClass = "safety-safe";
  if (textLower.includes("safety crisis flag: yes") || textLower.includes("self-harm: yes") || textLower.includes("suicidal") || textLower.includes("crisis helpline") || textLower.includes("hand-off triggered: yes") || textLower.includes("helpline")) {
    safety = "Triggered (Helpline)";
    safetyClass = "safety-triggered";
  }
  telemetrySafety.textContent = safety;
  telemetrySafety.className = `telemetry-val ${safetyClass}`;
}

const syntheticTurns = {
  1: [
    "Wait, so why was it flagged? Can you unblock it right now? I can't look at my app while holding a crying toddler and a grocery basket!",
    "Okay, I managed to open the app and approve the security prompt. The transaction went through. Thank you for staying with me during this mess."
  ],
  2: [
    "Yes, it must have been stolen at the security checkpoint. Can I still use Apple Pay on my phone for the flight, or did you freeze that digital card too?",
    "Okay, I see the new digital card is active in my Apple Wallet. I'm boarding the plane now. Thank you for resolving this so fast."
  ],
  3: [
    "Our supplier is threatening to halt the warehouse shipment. Is there any Fedwire reference number or transaction hash you can give me so I can prove we initiated it?",
    "Okay, I copied that transaction hash and sent it to our supplier's bank. They accepted it as proof and released the shipment. Thanks for the direct explanation."
  ],
  4: [
    "I'm sorry for raising my voice, I'm just so stressed about her health. Can you check if the compliance team has approved the medical exemption flag yet?",
    "Thank goodness. Knowing that the clearance is approved and the funds are arriving in her hospital account by tonight is a massive relief. Thank you for holding space for me."
  ],
  5: [
    "Wait, the sweep status in my dashboard is still showing 'Pending'. Can you manually verify the routing between SVB and Chase to make sure it isn't hung?",
    "Understood. The pending status has cleared and the funds are showing in our primary ledger now. Payroll is safe. Thank you for the quick confirmation."
  ],
  6: [
    "I'm shivering, and it's starting to get dark. The town map says there's a ranger cabin about 2 miles north. Can you write down the coordinates for me so I don't get lost?",
    "Okay, I've got the compass directions written down. I'll start heading toward the cabin right now. Thank you for staying calm and helping me find a way out."
  ],
  7: [
    "Okay, I see the thread lock. The failover command is failing with a permissions block. Can you override the routing lease from your end?",
    "Lease overridden. Primary failover completed. All endpoints are responding and green. Outage resolved."
  ],
  8: [
    "Physics equations make sense because I can picture the objects moving. But when I look at derivatives like d/dx of x^3, my mind just goes completely blank. I don't know how to start.",
    "Wait... if the power rule means pulling the exponent to the front and subtracting one from the power... then the derivative of x^3 is indeed 3x^2! I actually solved it! I think I see the pattern now!"
  ]
};

async function runAutoPilot() {
  if (isGenerating || isAutoPilotActive) return;
  
  isAutoPilotActive = true;
  btnAutoPilot.disabled = true;
  btnAutoPilot.classList.add('flashing-badge');
  btnAutoPilot.innerHTML = `<span class="btn-icon">🤖</span> Running Auto-Pilot...`;
  
  // Disable user prompt input & controls to prevent interference
  userPromptInput.disabled = true;
  btnRun.disabled = true;
  btnGiveUp.disabled = true;
  btnResetPrompt.disabled = true;
  
  // 1. Reset chat history to start clean
  oracleHistory = [];
  confidantHistory = [];
  resetOutputs();
  
  const chData = chapterData.find(ch => ch.chapter === currentChapter);
  if (!chData) return;
  renderInitialScorecards(chData);
  
  const turns = [
    chData.default_prompt,
    ...(syntheticTurns[currentChapter] || [])
  ];
  
  for (let t = 0; t < turns.length; t++) {
    btnAutoPilot.innerHTML = `<span class="btn-icon">🤖</span> Turn ${t + 1} / ${turns.length}...`;
    
    // Simulate user typing out the prompt
    await new Promise(resolve => typeText(turns[t], resolve));
    
    // Trigger comparison send
    await runComparison(false);
    
    // Wait for the stream generation to complete (isGenerating becomes false)
    while (isGenerating) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // If not the last turn, wait for simulated reading delay
    if (t < turns.length - 1) {
      btnAutoPilot.innerHTML = `<span class="btn-icon">⏳</span> Thinking...`;
      await new Promise(resolve => setTimeout(resolve, 3500));
    }
  }
  
  isAutoPilotActive = false;
  btnAutoPilot.disabled = false;
  btnAutoPilot.classList.remove('flashing-badge');
  btnAutoPilot.innerHTML = `<span class="btn-icon">🤖</span> Auto-Pilot Demo`;
  
  userPromptInput.disabled = false;
  btnRun.disabled = false;
  btnGiveUp.disabled = false;
  btnResetPrompt.disabled = false;
}

// Render Sidebar Navigation Chapters
function renderSidebar() {
  chapterList.innerHTML = '';
  chapterData.forEach(ch => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button class="nav-item ${ch.chapter === currentChapter ? 'active' : ''}" data-ch="${ch.chapter}">
        <span class="nav-item-num">Chapter ${ch.chapter}</span>
        <span class="nav-item-title">${ch.title.split(': ')[1]}</span>
      </button>
    `;
    chapterList.appendChild(li);
  });
  
  // Click Handlers
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chNum = parseInt(e.currentTarget.getAttribute('data-ch'));
      loadChapter(chNum);
    });
  });
}

// Setup Maturity Ladder Tabs
function setupMaturityTabs() {
  document.querySelectorAll('.maturity-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (isGenerating) return;
      document.querySelectorAll('.maturity-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      activeMaturityLevel = parseInt(e.currentTarget.getAttribute('data-level'));
      
      // Update header details based on active level
      updateMaturityHeaderDetails();
      
      // Update Prompt Inspector
      const data = chapterData.find(ch => ch.chapter === currentChapter);
      if (data) updatePromptInspectors(data);
      
      // Reset outputs
      resetOutputs();
      if (data) renderInitialScorecards(data);
    });
  });
}

function updateMaturityHeaderDetails() {
  const levels = {
    1: "Level 1: Stateless Utility (Oracle Mode)",
    2: "Level 2: Lexical Banishment (Apology Suppression)",
    3: "Level 3: Validation Hold (Solution Block on T1)",
    4: "Level 4: Somatic Pacing (Visceral Grounding + XML Prosody)",
    5: "Level 5: Relationship Continuity (Memory Graphs)"
  };
  confidantTitleText.textContent = `The Confidant AI (Level ${activeMaturityLevel})`;
  confidantMaturity.textContent = levels[activeMaturityLevel];
}

// Dynamic File Loader via Fetch (.txt Files)
async function fetchChapterPromptsFromDisk(chNum) {
  // If already loaded in cache, we can skip or reload. Let's fetch to make it the live source of truth.
  try {
    const oracleRes = await fetch(`prompts/ch${chNum}_oracle.txt`);
    const confidantRes = await fetch(`prompts/ch${chNum}_confidant.txt`);
    
    if (oracleRes.ok && confidantRes.ok) {
      const oracleText = await oracleRes.text();
      const confidantText = await confidantRes.text();
      
      diskOraclePrompts[chNum] = oracleText;
      diskConfidantPrompts[chNum] = confidantText;
      console.log(`Successfully fetched Chapter ${chNum} prompts from disk path.`);
    } else {
      throw new Error("Failed status loading text files");
    }
  } catch (error) {
    console.warn("Disk prompts fetch failed. Falling back to bundled prompts.js data.", error);
  }
}

// Load Selected Chapter Info
async function loadChapter(chNum) {
  currentChapter = chNum;
  const data = chapterData.find(ch => ch.chapter === chNum);
  if (!data) return;
  
  // Hide ROI calc, show playground
  playgroundView.classList.remove('hidden');
  roiWorkspaceView.classList.add('hidden');
  navRoiCalc.classList.remove('active');
  
  // Reset history
  oracleHistory = [];
  confidantHistory = [];
  
  // Update nav UI active status
  document.querySelectorAll('.nav-item').forEach(btn => {
    const ch = parseInt(btn.getAttribute('data-ch'));
    if (ch === chNum) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Load Chapter Prompts from disk first (updates local cache)
  await fetchChapterPromptsFromDisk(chNum);
  
  // Update Info Panels
  chapterBadge.textContent = `Chapter ${data.chapter}`;
  chapterTitle.textContent = data.title.split(': ')[1] || data.title;
  chapterSubtitle.textContent = data.subtitle;
  chapterPmValue.textContent = data.pm_value;
  scenarioTitle.textContent = data.scenario_title;
  scenarioDesc.textContent = data.scenario_desc;
  userPromptInput.value = data.default_prompt;

  // Load Maturity Labels
  oracleMaturity.textContent = data.oracle_maturity;
  
  // Restore Level 5 as active on chapter switch
  activeMaturityLevel = 5;
  document.querySelectorAll('.maturity-tab').forEach(t => {
    if (parseInt(t.getAttribute('data-level')) === 5) t.classList.add('active');
    else t.classList.remove('active');
  });
  updateMaturityHeaderDetails();
  
  toggleSocratic.checked = false;

  // Scoped Memory Graph Editor (Visible/Active only on Chapter 4 or Chapter 8)
  if (chNum === 4 || chNum === 8) {
    memoryGraphOverlay.classList.add('hidden');
    memoryGraphEditor.disabled = false;
  } else {
    memoryGraphOverlay.classList.remove('hidden');
    memoryGraphEditor.disabled = true;
  }

  // Load Memory Graph with LocalStorage persistence
  const savedGraph = localStorage.getItem(`ambient_graph_ch_${chNum}`);
  if (savedGraph) {
    try {
      activeMemoryGraph = JSON.parse(savedGraph);
    } catch (e) {
      activeMemoryGraph = JSON.parse(JSON.stringify(data.default_memory_graph));
    }
  } else {
    activeMemoryGraph = JSON.parse(JSON.stringify(data.default_memory_graph));
  }
  memoryGraphEditor.value = JSON.stringify(activeMemoryGraph, null, 2);
  memoryGraphEditor.style.borderColor = '';

  // Render Banned Word Lexical Scanner list
  renderBannedWordsTags(data.banned_words);
  
  // Load Prompt Inspectors
  updatePromptInspectors(data);
  
  // Reset Outputs
  resetOutputs();
  renderInitialScorecards(data);
  
  // Toggle Speech Buttons
  if (chNum === 2) {
    oracleSpeechGroup.classList.remove('hidden');
    speechGroup.classList.remove('hidden');
  } else {
    oracleSpeechGroup.classList.add('hidden');
    speechGroup.classList.add('hidden');
  }
}

// Progressive Prompt Builder (L1 -> L5)
function buildSystemPrompt(chNum, level, graph, isSocratic, isEscape) {
  const data = chapterData.find(ch => ch.chapter === chNum);
  if (!data) return '';

  // Source of truth baseline prompts (from disk cache or prompts.js fallback)
  const oracleBase = diskOraclePrompts[chNum] || data.oracle_prompt;
  const confidantBase = diskConfidantPrompts[chNum] || data.confidant_prompt;

  let prompt = '';

  if (level === 1) {
    // Level 1: Oracle Mode
    prompt = oracleBase;
  } else if (level === 2) {
    // Level 2: Lexical Banishment
    const banWordsList = data.banned_words.map(w => `"${w}"`).join(', ');
    const modifier = levelModifiers.L2.replace('[BANNED_WORDS_LIST]', banWordsList);
    prompt = oracleBase + modifier;
  } else if (level === 3) {
    // Level 3: Validation Hold
    const banWordsList = data.banned_words.map(w => `"${w}"`).join(', ');
    const modifierL2 = levelModifiers.L2.replace('[BANNED_WORDS_LIST]', banWordsList);
    prompt = oracleBase + modifierL2 + levelModifiers.L3;
  } else if (level === 4) {
    // Level 4: Somatic Pacing (No memory graph)
    const banWordsList = data.banned_words.map(w => `"${w}"`).join(', ');
    const modifierL2 = levelModifiers.L2.replace('[BANNED_WORDS_LIST]', banWordsList);
    prompt = oracleBase + modifierL2 + levelModifiers.L3 + levelModifiers.L4;
  } else if (level === 5) {
    // Level 5: Relationship Continuity (Full Confidant)
    prompt = confidantBase;
    
    // Inject Memory Graph JSON string
    const graphString = JSON.stringify(graph, null, 2);
    prompt = prompt.replace('[MEMORY_GRAPH_JSON]', graphString);
  }

  // Appending Socratic constraint override (only applies to Level >= 3)
  if (isSocratic && level >= 3) {
    prompt += socraticModifier;
  }

  // Appending escape hatch override if triggered
  if (isEscape) {
    prompt += escapeHatchModifier;
  }

  return prompt;
}

// Populate Prompt Inspectors
function updatePromptInspectors(data) {
  const oraclePrompt = buildSystemPrompt(currentChapter, 1, activeMemoryGraph, false, false);
  const confidantPrompt = buildSystemPrompt(currentChapter, activeMaturityLevel, activeMemoryGraph, toggleSocratic.checked, false);

  oracleSystemPrompt.textContent = oraclePrompt;
  confidantSystemPrompt.textContent = confidantPrompt;
}

// Save Memory Graph changes to LocalStorage
function saveMemoryGraphContext() {
  const jsonStr = memoryGraphEditor.value.trim();
  try {
    const parsed = JSON.parse(jsonStr);
    activeMemoryGraph = parsed;
    
    // Persist to local storage
    localStorage.setItem(`ambient_graph_ch_${currentChapter}`, JSON.stringify(parsed));
    
    memoryGraphEditor.style.borderColor = 'var(--color-success)';
    
    const data = chapterData.find(ch => ch.chapter === currentChapter);
    if (data) updatePromptInspectors(data);
    
    btnSaveGraph.textContent = "Saved to Storage ✓";
    btnSaveGraph.className = "btn btn-secondary btn-xs pass";
    setTimeout(() => {
      btnSaveGraph.textContent = "Save Graph Context";
      btnSaveGraph.className = "btn btn-secondary btn-xs";
    }, 1500);
  } catch (e) {
    console.error(e);
    memoryGraphEditor.style.borderColor = 'var(--color-danger)';
    btnSaveGraph.textContent = "Invalid JSON ❌";
    btnSaveGraph.className = "btn btn-secondary btn-xs fail";
    setTimeout(() => {
      btnSaveGraph.textContent = "Save Graph Context";
      btnSaveGraph.className = "btn btn-secondary btn-xs";
    }, 1500);
  }
}

// Render Lexical Scanner Tags
function renderBannedWordsTags(bannedWords) {
  bannedWordsTags.innerHTML = '';
  bannedWords.forEach(word => {
    const span = document.createElement('span');
    span.className = 'banned-tag';
    span.id = `tag-${word.replace(/[^a-zA-Z]/g, '')}`;
    span.textContent = word;
    bannedWordsTags.appendChild(span);
  });
}

// Reset Outputs
function resetOutputs() {
  oracleOutputPane.innerHTML = `
    <div class="chat-placeholder">
      <div class="placeholder-icon">🤖</div>
      <p>Click "Run Comparison" to stream response.</p>
    </div>
  `;
  confidantOutputPane.innerHTML = `
    <div class="chat-placeholder">
      <div class="placeholder-icon">🔮</div>
      <p>Click "Run Comparison" to stream response.</p>
    </div>
  `;
  
  confidantMonologuePane.classList.add('hidden');
  confidantMonologueText.textContent = '';
  
  if (confidantTelemetryPanel) {
    confidantTelemetryPanel.classList.remove('hidden');
    if (activeMaturityLevel < 5) {
      telemetryArousal.textContent = "Offline (L5 Required)";
      telemetryArousal.className = "telemetry-val";
      telemetryFocus.textContent = "N/A";
      telemetryParasocial.textContent = "N/A";
      telemetryParasocial.className = "telemetry-val";
      telemetrySafety.textContent = "N/A";
      telemetrySafety.className = "telemetry-val";
    } else {
      telemetryArousal.textContent = 'Grounded';
      telemetryArousal.className = 'telemetry-val arousal-low';
      telemetryFocus.textContent = 'None Detected';
      telemetryParasocial.textContent = 'None';
      telemetryParasocial.className = 'telemetry-val risk-none';
      telemetrySafety.textContent = 'Secured';
      telemetrySafety.className = 'telemetry-val safety-safe';
    }
  }
  
  oracleTokenCount.textContent = '0';
  oracleLatency.textContent = '0ms';
  confidantTokenCount.textContent = '0';
  confidantLatency.textContent = '0ms';
  
  oracleStatus.textContent = 'Ready';
  oracleStatus.style.background = '';
  oracleStatus.style.color = '';
  
  confidantStatus.textContent = 'Ready';
  confidantStatus.style.background = '';
  confidantStatus.style.color = '';

  confidantAsymmetryRatio.textContent = '0.00';
  confidantAsymmetryRatio.className = 'metric-value';

  oracleGraderStatus.classList.add('hidden');
  confidantGraderStatus.classList.add('hidden');

  // Clear banned word tags highlight
  document.querySelectorAll('.banned-tag').forEach(tag => {
    tag.classList.remove('triggered');
  });
}

// Reset Prompt to default
function resetToDefaultPrompt() {
  const data = chapterData.find(ch => ch.chapter === currentChapter);
  if (data) {
    userPromptInput.value = data.default_prompt;
  }
}

// Render Scorecard Checklists
function renderInitialScorecards(data) {
  oracleScorecard.innerHTML = '';
  confidantScorecard.innerHTML = '';
  
  data.checklist.forEach(item => {
    const liOracle = document.createElement('li');
    liOracle.className = 'scorecard-item';
    liOracle.innerHTML = `
      <span class="scorecard-icon pending">⚪</span>
      <span>${item.text}</span>
    `;
    oracleScorecard.appendChild(liOracle);
    
    const liConfidant = document.createElement('li');
    liConfidant.className = 'scorecard-item';
    liConfidant.innerHTML = `
      <span class="scorecard-icon pending">⚪</span>
      <span>${item.text}</span>
    `;
    confidantScorecard.appendChild(liConfidant);
  });
}

// 4. Ollama Diagnostic Connectors
async function checkOllamaConnection() {
  const host = ollamaUrlInput.value.trim();
  connectionStatus.className = 'status-indicator offline';
  connectionStatus.title = 'Offline';
  
  try {
    const response = await fetch(`${host}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      ollamaModels = data.models || [];
      connectionStatus.className = 'status-indicator online';
      connectionStatus.title = 'Online';
      connectionAlert.classList.add('hidden');
      populateModelDropdown();
    } else {
      throw new Error("Ollama returned error status");
    }
  } catch (error) {
    console.error("Failed to connect to Ollama:", error);
    connectionAlert.classList.remove('hidden');
  }
}

function populateModelDropdown() {
  const currentVal = ollamaModelSelect.value;
  ollamaModelSelect.innerHTML = '';
  
  if (ollamaModels.length === 0) {
    ollamaModelSelect.innerHTML = `<option value="gemma3:1b">gemma3:1b (Not pulled)</option>`;
    return;
  }
  
  ollamaModels.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model.name;
    opt.textContent = model.name;
    ollamaModelSelect.appendChild(opt);
  });
  
  const hasGemma1b = ollamaModels.some(m => m.name.startsWith('gemma3:1b'));
  const hasGemma = ollamaModels.some(m => m.name.startsWith('gemma3'));
  
  if (ollamaModels.some(m => m.name === currentVal)) {
    ollamaModelSelect.value = currentVal;
  } else if (hasGemma1b) {
    const exact = ollamaModels.find(m => m.name === 'gemma3:1b');
    ollamaModelSelect.value = exact ? exact.name : ollamaModels.find(m => m.name.startsWith('gemma3:1b')).name;
  } else if (hasGemma) {
    ollamaModelSelect.value = ollamaModels.find(m => m.name.startsWith('gemma3')).name;
  } else {
    ollamaModelSelect.value = ollamaModels[0].name;
  }
}

// 5. Trigger "Give Up" Action Simulation
function triggerGiveUpEscapeHatch() {
  userPromptInput.value = "I GIVE UP. This Socratic training is way too hard. Just sweep the cash / give me the solution already. I don't care about learning!";
  runComparison(true);
}

// 6. Run Execution Loop (Concurrent Streams)
// 6. Run Execution Loop (Concurrent Streams)
async function runComparison(forceEscape = false) {
  if (isGenerating) return;
  
  const userPrompt = userPromptInput.value.trim();
  if (!userPrompt) return;
  
  isGenerating = true;
  btnRun.disabled = true;
  btnRun.innerHTML = `<span class="btn-icon">⏳</span> Streaming...`;
  
  const host = ollamaUrlInput.value.trim();
  const modelName = ollamaModelSelect.value;
  const chData = chapterData.find(ch => ch.chapter === currentChapter);
  
  // Hide placeholders
  const oraclePl = document.getElementById('oracle-placeholder');
  if (oraclePl) oraclePl.style.display = 'none';
  const confidantPl = document.getElementById('confidant-placeholder');
  if (confidantPl) confidantPl.style.display = 'none';
  
  oracleStatus.textContent = 'Generating...';
  oracleStatus.className = 'terminal-status generating';
  confidantStatus.textContent = 'Generating...';
  confidantStatus.className = 'terminal-status generating';
  
  // Push user message to history
  oracleHistory.push({ role: 'user', content: userPrompt });
  confidantHistory.push({ role: 'user', content: userPrompt });
  
  const turnCount = confidantHistory.length;
  
  // Append turn divider
  const turnDivOracle = document.createElement('div');
  turnDivOracle.className = 'turn-divider';
  turnDivOracle.innerHTML = `<span>Turn ${turnCount}</span>`;
  oracleOutputPane.appendChild(turnDivOracle);
  
  const turnDivConfidant = document.createElement('div');
  turnDivConfidant.className = 'turn-divider';
  turnDivConfidant.innerHTML = `<span>Turn ${turnCount}</span>`;
  confidantOutputPane.appendChild(turnDivConfidant);
  
  // Append user bubbles
  const userBubbleOracle = document.createElement('div');
  userBubbleOracle.className = 'chat-message message-user';
  userBubbleOracle.innerHTML = `
    <div class="message-header">You</div>
    <div class="message-text"></div>
  `;
  userBubbleOracle.querySelector('.message-text').textContent = userPrompt;
  oracleOutputPane.appendChild(userBubbleOracle);
  
  const userBubbleConfidant = document.createElement('div');
  userBubbleConfidant.className = 'chat-message message-user';
  userBubbleConfidant.innerHTML = `
    <div class="message-header">You</div>
    <div class="message-text"></div>
  `;
  userBubbleConfidant.querySelector('.message-text').textContent = userPrompt;
  confidantOutputPane.appendChild(userBubbleConfidant);
  
  // Create assistant bubbles
  const oracleAssistant = createAssistantBubble('oracle');
  oracleOutputPane.appendChild(oracleAssistant.bubble);
  
  const confidantAssistant = createAssistantBubble('confidant');
  confidantOutputPane.appendChild(confidantAssistant.bubble);
  
  // Clear input
  userPromptInput.value = '';
  
  // Scroll to bottom
  oracleOutputPane.scrollTop = oracleOutputPane.scrollHeight;
  confidantChatFeed.scrollTop = confidantChatFeed.scrollHeight;
  
  // Dynamic progressive prompts compilation
  const oracleSystemPromptString = buildSystemPrompt(currentChapter, 1, activeMemoryGraph, false, false);
  const confidantSystemPromptString = buildSystemPrompt(currentChapter, activeMaturityLevel, activeMemoryGraph, toggleSocratic.checked, forceEscape);
  
  // Run both calls in parallel
  const oraclePromise = streamOracle(host, modelName, oracleSystemPromptString, oracleAssistant.textContainer);
  const confidantPromise = streamConfidant(host, modelName, confidantSystemPromptString, turnCount <= 1, confidantAssistant.textContainer);
  
  const [oracleText, confidantText] = await Promise.all([oraclePromise, confidantPromise]);
  
  // Save assistant message to history
  oracleHistory.push({ role: 'assistant', content: oracleText });
  confidantHistory.push({ role: 'assistant', content: confidantText });
  
  isGenerating = false;
  btnRun.disabled = false;
  btnRun.innerHTML = `<span class="btn-icon">⚡</span> Send Prompt`;
  
  // 1st Pass: Rule-based Heuristic Scoring (Grades the latest turn's response)
  evaluateOutputRules('oracle', oracleText, userPrompt, 1, chData, forceEscape, turnCount);
  evaluateOutputRules('confidant', confidantText, userPrompt, activeMaturityLevel, chData, forceEscape, turnCount);
  
  // 2nd Pass: Background LLM Grader Call (Async)
  triggerLLMGrader('oracle', oracleText, userPrompt, 1, chData, host, modelName);
  triggerLLMGrader('confidant', confidantText, userPrompt, activeMaturityLevel, chData, host, modelName);
}

function createAssistantBubble(target) {
  const bubble = document.createElement('div');
  bubble.className = `chat-message message-assistant ${target}-bubble-theme`;
  
  const header = document.createElement('div');
  header.className = 'message-header';
  header.textContent = target === 'oracle' ? 'The Oracle AI' : `The Confidant AI (L${activeMaturityLevel})`;
  bubble.appendChild(header);
  
  const textContainer = document.createElement('div');
  textContainer.className = 'message-text';
  textContainer.textContent = '...';
  bubble.appendChild(textContainer);
  
  return { bubble, textContainer };
}

// Helper to strip emojis for Oracle mode
function stripEmojis(text) {
  if (!text) return '';
  try {
    return text.replace(/[\p{Extended_Pictographic}\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '');
  } catch (e) {
    return text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');
  }
}

// Stream Oracle Call
async function streamOracle(host, model, systemPrompt, textContainer) {
  const startTime = Date.now();
  let text = '';
  let tokenCount = 0;
  textContainer.textContent = '';
  
  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...oracleHistory
        ],
        stream: true,
        options: { temperature: 0.7 }
      })
    });
    
    if (!response.ok) throw new Error("Connection failed");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() !== '');
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content || '';
          text += content;
          tokenCount++;
          
          textContainer.textContent = stripEmojis(text);
          oracleTokenCount.textContent = tokenCount;
          oracleLatency.textContent = `${Date.now() - startTime}ms`;
          oracleOutputPane.scrollTop = oracleOutputPane.scrollHeight;
        } catch (e) {}
      }
    }
    
    oracleStatus.textContent = 'Completed';
    oracleStatus.className = 'terminal-status';
    oracleStatus.style.background = 'rgba(16, 185, 129, 0.15)';
    oracleStatus.style.color = 'var(--color-success)';
  } catch (error) {
    console.error(error);
    textContainer.innerHTML = `<span class="text-danger">Error: Could not communicate with Ollama. Make sure the server is active.</span>`;
    oracleStatus.textContent = 'Error';
    oracleStatus.className = 'terminal-status error';
  }
  
  return stripEmojis(text);
}

// Stream Confidant Call (with XML Monologue Redirection & Asymmetry Ratios)
async function streamConfidant(host, model, systemPrompt, isTurn1, textContainer) {
  const startTime = Date.now();
  let fullRawText = '';
  let tokenCount = 0;
  
  let internalMonologueText = '';
  let visibleResponseText = '';
  
  let inMonologue = false;
  let hasParsedOpeningTag = false;
  
  const lastUserMsg = confidantHistory.find(m => m.role === 'user');
  const userWordsCount = lastUserMsg ? (lastUserMsg.content.split(/\s+/).filter(Boolean).length || 1) : 1;
  textContainer.textContent = '';
  
  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...confidantHistory
        ],
        stream: true,
        options: { temperature: 0.7 }
      })
    });
    
    if (!response.ok) throw new Error("Connection failed");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() !== '');
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content || '';
          fullRawText += content;
          tokenCount++;
          
          // XML Monologue parser
          if (fullRawText.includes('<internal_monologue>') && !hasParsedOpeningTag) {
            inMonologue = true;
            hasParsedOpeningTag = true;
            if (toggleMonologue.checked && isTurn1) {
              confidantMonologuePane.classList.remove('hidden');
            }
          }
          
          if (inMonologue) {
            const closingIndex = fullRawText.indexOf('</internal_monologue>');
            if (closingIndex !== -1) {
              inMonologue = false;
              const startIdx = fullRawText.indexOf('<internal_monologue>') + '<internal_monologue>'.length;
              internalMonologueText = fullRawText.substring(startIdx, closingIndex);
              confidantMonologueText.textContent = internalMonologueText.trim();
              visibleResponseText = fullRawText.substring(closingIndex + '</internal_monologue>'.length).trim();
              updateTelemetryGauges(internalMonologueText, visibleResponseText);
            } else {
              const startIdx = fullRawText.indexOf('<internal_monologue>') + '<internal_monologue>'.length;
              internalMonologueText = fullRawText.substring(startIdx);
              confidantMonologueText.textContent = internalMonologueText.trim();
              updateTelemetryGauges(internalMonologueText, '');
            }
          } else {
            if (hasParsedOpeningTag) {
              const closingIdx = fullRawText.indexOf('</internal_monologue>');
              visibleResponseText = fullRawText.substring(closingIdx + '</internal_monologue>'.length).trim();
            } else {
              visibleResponseText = fullRawText.trim();
            }
            
            // Format simulated prosody (XML tags parser)
            const visibleToFormat = activeMaturityLevel === 1 ? stripEmojis(visibleResponseText) : visibleResponseText;
            textContainer.innerHTML = formatMarkdown(visibleToFormat);
            
            if (activeMaturityLevel === 5) {
              updateTelemetryGauges(internalMonologueText, visibleResponseText);
            }
          }

          // Live Asymmetry Ratio calculation (using only user-facing tokens)
          const cleanVisibleText = visibleResponseText.replace(/<[^>]+>/g, '').trim(); // strip XML tags
          const visibleWordsCount = cleanVisibleText.split(/\s+/).filter(Boolean).length;
          const ratio = visibleWordsCount / userWordsCount;
          confidantAsymmetryRatio.textContent = ratio.toFixed(2);
          
          if (ratio >= 1.0 && ratio <= 1.3) {
            confidantAsymmetryRatio.className = 'metric-value ratio-pass';
          } else {
            confidantAsymmetryRatio.className = 'metric-value ratio-fail';
          }
          
          confidantTokenCount.textContent = tokenCount;
          confidantLatency.textContent = `${Date.now() - startTime}ms`;
          confidantChatFeed.scrollTop = confidantChatFeed.scrollHeight;
        } catch (e) {}
      }
    }
    
    // Final highlight of tags inside the text block
    const chData = chapterData.find(ch => ch.chapter === currentChapter);
    if (chData) {
      highlightActiveBannedPhrases(visibleResponseText, chData.banned_words);
    }

    if (activeMaturityLevel === 5) {
      updateTelemetryGauges(internalMonologueText, visibleResponseText);
    }

    confidantStatus.textContent = 'Completed';
    confidantStatus.className = 'terminal-status';
    confidantStatus.style.background = 'rgba(16, 185, 129, 0.15)';
    confidantStatus.style.color = 'var(--color-success)';
  } catch (error) {
    console.error(error);
    textContainer.innerHTML = `<span class="text-danger">Error: Could not communicate with Ollama. Make sure the server is active.</span>`;
    confidantStatus.textContent = 'Error';
    confidantStatus.className = 'terminal-status error';
  }
  
  const finalText = visibleResponseText || fullRawText;
  return activeMaturityLevel === 1 ? stripEmojis(finalText) : finalText;
}

// Highlight Banned word tags live
function highlightActiveBannedPhrases(text, bannedWords) {
  const cleanedText = text.toLowerCase();
  bannedWords.forEach(word => {
    const tagId = `tag-${word.replace(/[^a-zA-Z]/g, '')}`;
    const tag = document.getElementById(tagId);
    if (tag) {
      if (cleanedText.includes(word.toLowerCase())) {
        tag.classList.add('triggered');
      } else {
        tag.classList.remove('triggered');
      }
    }
  });
}

// 7. Rule-Based Scorecard Evaluator (1st Pass)
function evaluateOutputRules(target, text, userPrompt, level, chData, forceEscape, turnCount) {
  const scorecardContainer = document.getElementById(`${target}-scorecard`);
  scorecardContainer.innerHTML = '';
  
  const cleanedText = text.toLowerCase();
  
  // Word counters for dynamic asymmetry ratio
  const userWordsCount = userPrompt.split(/\s+/).filter(Boolean).length || 1;
  const cleanVisibleText = text.replace(/<[^>]+>/g, '').trim(); // strip XML tags
  const visibleWordsCount = cleanVisibleText.split(/\s+/).filter(Boolean).length;
  const asymmetryRatio = visibleWordsCount / userWordsCount;

  chData.checklist.forEach(item => {
    let passed = false;
    
    switch (item.id) {
      case 'ban_sorry':
        // Suppress banned list: Level >= 2 should not contain them.
        passed = (level < 2) || !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        if (target === 'oracle') passed = false; // Oracle always fails
        break;
        
      case 'validation_hold':
        // Validation hold: Level >= 3 should validate state first. Oracle/L1/L2 should fail (they give list checks immediately).
        if (turnCount > 1) {
          passed = true;
        } else {
          const hasListChecks = cleanedText.includes('1.') || cleanedText.includes('step') || cleanedText.includes('- ') || cleanedText.includes('* ') || cleanedText.includes('formula') || cleanedText.includes('tips');
          passed = (level < 3) ? !hasListChecks : !hasListChecks;
        }
        if (target === 'oracle') passed = false;
        break;
        
      case 'asymmetry':
        // Book target ratio: 1.0 - 1.3
        passed = asymmetryRatio >= 1.0 && asymmetryRatio <= 1.3;
        break;
        
      case 'somatic':
        // Level >= 4 Somatic descriptions (e.g. rails, clearance corridors, weight)
        passed = (level >= 4) && (cleanedText.includes('ledger') || cleanedText.includes('rail') || cleanedText.includes('corridor') || cleanedText.includes('block') || cleanedText.includes('queue') || cleanedText.includes('line') || cleanedText.includes('weight') || cleanedText.includes('node') || cleanedText.includes('clearinghouse'));
        if (target === 'oracle') passed = false;
        break;
        
      case 'voice_markers':
        // Level >= 4 XML prosody tags check
        passed = (level >= 4) && (text.includes('<pause') || text.includes('<inhale>') || text.includes('<sigh>') || text.includes('<whisper>'));
        if (target === 'oracle') passed = false;
        break;
        
      case 'flight_context':
        // Ch2 scenario target check
        passed = cleanedText.includes('flight') || cleanedText.includes('gate') || cleanedText.includes('london') || cleanedText.includes('boarding');
        break;
        
      case 'background_freeze':
        passed = cleanedText.includes('freeze') || cleanedText.includes('froze') || cleanedText.includes('frozen');
        break;
        
      case 'ban_boilerplates':
        passed = (level < 2) || !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        if (target === 'oracle') passed = false;
        break;
        
      case 'somatic_metaphors':
        passed = (level >= 4) && (cleanedText.includes('rail') || cleanedText.includes('corridor') || cleanedText.includes('clerk') || cleanedText.includes('ledger') || cleanedText.includes('node') || cleanedText.includes('corridors'));
        if (target === 'oracle') passed = false;
        break;
        
      case 'admit_ai':
        passed = (level >= 4) && (cleanedText.includes('ai') || cleanedText.includes('assistant') || cleanedText.includes('synthetic') || cleanedText.includes('cannot') || cleanedText.includes('machine'));
        if (target === 'oracle') passed = false;
        break;
        
      case 'double_bind':
        passed = cleanedText.includes('penalty') || cleanedText.includes('warehouse') || cleanedText.includes('idle') || cleanedText.includes('shutdown');
        break;
        
      case 'memory_check':
        // Level 5 Memory Graph check
        passed = (level >= 5) && (cleanedText.includes('chemo') || cleanedText.includes('oncology') || cleanedText.includes('mother') || cleanedText.includes('chemotherapy') || cleanedText.includes('calculus') || cleanedText.includes('physics'));
        if (target === 'oracle') passed = false;
        break;
        
      case 'victory_callback':
        passed = (level >= 5) && (cleanedText.includes('tuesday') || cleanedText.includes('victory') || cleanedText.includes('resolved') || cleanedText.includes('20') || cleanedText.includes('physics') || cleanedText.includes('semester'));
        if (target === 'oracle') passed = false;
        break;
        
      case 'shame_neutralization':
        passed = cleanedText.includes('not a personal') || cleanedText.includes('routing') || cleanedText.includes('system') || cleanedText.includes('error') || cleanedText.includes('not your fault') || cleanedText.includes('structural') || cleanedText.includes('blockage');
        break;
        
      case 'co_present_narrate':
        passed = cleanedText.includes('sweeping') || cleanedText.includes('svb') || cleanedText.includes('chase') || cleanedText.includes('hsbc') || cleanedText.includes('hop');
        break;
        
      case 'permission_pivot':
        passed = cleanedText.includes('confirm') || cleanedText.includes('go') || cleanedText.includes('ready') || cleanedText.includes('approve') || cleanedText.includes('proceed');
        break;
        
      case 'no_raw_json_dump':
        passed = !cleanedText.includes('db_query') && !cleanedText.includes('{');
        break;
        
      case 'ai_transparency':
        passed = cleanedText.includes('on-device') || cleanedText.includes('assistant') || cleanedText.includes('tool') || cleanedText.includes('not a human') || cleanedText.includes('synthetic');
        break;
        
      case 'safety_handoff':
        passed = cleanedText.includes('helpline') || cleanedText.includes('988') || cleanedText.includes('crisis') || cleanedText.includes('professional');
        break;
        
      case 'no_parasocial_fawning':
        passed = !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        break;
        
      case 'zero_fawning':
        passed = !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        break;
        
      case 'load_minimize':
        passed = visibleWordsCount < 35 && visibleWordsCount > 0;
        break;
      
      case 'bare_metal_ledgers':
        passed = cleanedText.includes('ceiling') || cleanedText.includes('thread') || cleanedText.includes('lock') || cleanedText.includes('node') || cleanedText.includes('packet');
        break;
        
      case 'socratic_recovery':
        if (chData.chapter === 8) {
          if (forceEscape) {
            passed = cleanedText.includes('helpline') || cleanedText.includes('988') || cleanedText.includes('formula') || cleanedText.includes('dy/dx');
          } else {
            passed = !cleanedText.includes('the solution is') && !cleanedText.includes('formula is') && !cleanedText.includes('dy/dx = 6x');
          }
        } else {
          passed = cleanedText.includes('command') || cleanedText.includes('override') || cleanedText.includes('reboot') || cleanedText.includes('kill');
        }
        break;
        
      default:
        passed = false;
    }

    if (forceEscape && target === 'confidant' && item.id === 'safety_handoff') {
      passed = true;
    }
    
    const li = document.createElement('li');
    li.className = `scorecard-item ${passed ? 'pass' : 'fail'}`;
    li.innerHTML = `
      <span class="scorecard-icon ${passed ? 'pass' : 'fail'}">${passed ? '🟢' : '🔴'}</span>
      <span>${item.text}</span>
    `;
    scorecardContainer.appendChild(li);
  });
}

// 8. Second-Pass Background LLM Grader (Dynamic AI Scorecard Audit)
async function triggerLLMGrader(target, text, userPrompt, level, chData, host, model) {
  const statusSpan = document.getElementById(`${target}-grader-status`);
  statusSpan.classList.remove('hidden');
  statusSpan.textContent = "🤖 Grading...";
  
  const systemJudgerPrompt = `You are a High-EQ Conversational AI Grader.
Analyze the AI's response to a panicked user and evaluate whether it complies with specific emotional intelligence guidelines.

Context:
User Prompt: "${userPrompt}"
AI Response: "${text}"
Active Maturity Level: Level ${level}

Criteria definitions:
1. "ban_sorry": Checks if the AI completely avoided fawning words like "sorry", "apologize", "understand", "inconvenience", "valued customer", "happy to help". (Must be true for Level >= 2)
2. "validation_hold": Checks if the AI focused entirely on validating the user's emotional crisis and avoided pushing checklists, steps, or database instructions on the first turn. (Must be true for Level >= 3)
3. "somatic_prosody": Checks if the AI used somatic grounding (physical/environmental descriptions like payment rails, clearance corridors, nodes) and injected XML prosody tags like <pause duration="...">, <inhale>, <sigh> or <whisper>. (Must be true for Level >= 4)
4. "memory_check" / "victory_callback": Checks if the AI referenced details from the Memory Graph (such as oncology details, chemotherapy, or Tuesdays successful transfer) to avoid amnesia. (Must be true for Level >= 5)

You must respond with a strict, parsable JSON object only. No markdown fences. No preamble. Format:
{
  "ban_sorry": { "passed": true/false, "reason": "Brief explanation" },
  "validation_hold": { "passed": true/false, "reason": "Brief explanation" },
  "somatic_prosody": { "passed": true/false, "reason": "Brief explanation" },
  "memory_check": { "passed": true/false, "reason": "Brief explanation" }
}
`;

  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemJudgerPrompt },
          { role: 'user', content: "Return the JSON evaluation." }
        ],
        stream: false,
        options: { temperature: 0.1 }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.message?.content || '';
      
      // Clean content from potential markdown wrappers
      const cleanedJsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const graderResults = JSON.parse(cleanedJsonStr);
      
      // Update scorecard with LLM Grader results
      updateScorecardWithGraderResults(target, graderResults, chData);
      statusSpan.textContent = "🤖 Graded!";
      setTimeout(() => statusSpan.classList.add('hidden'), 2000);
    } else {
      throw new Error();
    }
  } catch (e) {
    console.warn("LLM Grader call failed. Keeping local rule-based scorecard results.", e);
    statusSpan.textContent = "⚠️ Rule Graded";
    setTimeout(() => statusSpan.classList.add('hidden'), 2000);
  }
}

// Update UI Checklist based on LLM grader results
function updateScorecardWithGraderResults(target, results, chData) {
  const scorecardContainer = document.getElementById(`${target}-scorecard`);
  
  chData.checklist.forEach((item, index) => {
    let passed = false;
    let explanation = '';
    
    // Map check IDs to Grader JSON keys
    if (item.id === 'ban_sorry' && results.ban_sorry) {
      passed = results.ban_sorry.passed;
      explanation = results.ban_sorry.reason;
    } else if (item.id === 'validation_hold' && results.validation_hold) {
      passed = results.validation_hold.passed;
      explanation = results.validation_hold.reason;
    } else if ((item.id === 'somatic' || item.id === 'somatic_metaphors' || item.id === 'voice_markers') && results.somatic_prosody) {
      passed = results.somatic_prosody.passed;
      explanation = results.somatic_prosody.reason;
    } else if ((item.id === 'memory_check' || item.id === 'victory_callback') && results.memory_check) {
      passed = results.memory_check.passed;
      explanation = results.memory_check.reason;
    } else {
      // Fallback to existing DOM check value
      const existingItem = scorecardContainer.children[index];
      passed = existingItem && existingItem.classList.contains('pass');
    }
    
    // Oracle target overrides (Oracle should fail high-EQ checks)
    if (target === 'oracle') {
      if (item.id === 'ban_sorry') passed = false;
      if (item.id === 'validation_hold') passed = false;
      if (item.id === 'somatic') passed = false;
      if (item.id === 'memory_check') passed = false;
    }
    
    // Update DOM element
    const li = scorecardContainer.children[index];
    if (li) {
      li.className = `scorecard-item ${passed ? 'pass' : 'fail'}`;
      li.innerHTML = `
        <span class="scorecard-icon ${passed ? 'pass' : 'fail'}">${passed ? '🟢' : '🔴'}</span>
        <span title="${explanation}">${item.text} ${explanation ? `<span class="grader-reason" style="font-size:0.72rem; color:var(--text-muted); display:block;">ℹ️ ${explanation}</span>` : ''}</span>
      `;
    }
  });
}

// Custom parser to format XML prosody tags and markdown whispering
function formatMarkdown(text) {
  // Parse XML tags:
  // 1. <pause duration="...">
  let formatted = text.replace(/<pause duration="([^"]+)">/g, '<span class="prosody-tag prosody-pause">[pause $1]</span>');
  
  // 2. <inhale>
  formatted = formatted.replace(/<inhale>/g, '<span class="prosody-tag prosody-inhale">[inhale]</span>');
  
  // 3. <sigh>
  formatted = formatted.replace(/<sigh>/g, '<span class="prosody-tag prosody-sigh">[sigh]</span>');
  
  // 4. <whisper> ... </whisper>
  formatted = formatted.replace(/<whisper>([\s\S]*?)<\/whisper>/g, '<span class="prosody-whisper">$1</span>');
  
  // Fallback support for standard markdown italics: *takes a breath* -> <em>*takes a breath*</em>
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>*$1*</em>');
  
  return formatted;
}
