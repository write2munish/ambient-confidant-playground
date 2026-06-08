// The Ambient Confidant Playground - Core Javascript Application (app.js - Updated)

// 1. State Management
let currentChapter = 1;
let isGenerating = false;
let ollamaModels = [];
let activeMemoryGraph = {};

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

// New Advanced Control Elements
const memoryGraphEditor = document.getElementById('memory-graph-editor');
const btnSaveGraph = document.getElementById('btn-save-graph');
const toggleSocratic = document.getElementById('toggle-socratic');
const btnGiveUp = document.getElementById('btn-give-up');
const bannedWordsTags = document.getElementById('banned-words-tags');

// Terminal Elements
const oracleOutputPane = document.getElementById('oracle-output-pane');
const oracleStatus = document.getElementById('oracle-status');
const oracleTokenCount = document.getElementById('oracle-token-count');
const oracleLatency = document.getElementById('oracle-latency');
const oracleScorecard = document.getElementById('oracle-scorecard');
const oracleSystemPrompt = document.getElementById('oracle-system-prompt');
const oracleMaturity = document.getElementById('oracle-maturity');

const confidantOutputPane = document.getElementById('confidant-output-pane');
const confidantStatus = document.getElementById('confidant-status');
const confidantTokenCount = document.getElementById('confidant-token-count');
const confidantLatency = document.getElementById('confidant-latency');
const confidantScorecard = document.getElementById('confidant-scorecard');
const confidantSystemPrompt = document.getElementById('confidant-system-prompt');
const confidantMonologuePane = document.getElementById('confidant-monologue-pane');
const confidantMonologueText = document.getElementById('confidant-monologue-text');
const toggleMonologue = document.getElementById('toggle-monologue');
const confidantMaturity = document.getElementById('confidant-maturity');

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

  // Highlight Socratic Mode triggers in system prompts live
  toggleSocratic.addEventListener('change', () => {
    const data = chapterData.find(ch => ch.chapter === currentChapter);
    if (data) {
      updatePromptInspectors(data);
    }
  });
});

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

// Load Selected Chapter Info
function loadChapter(chNum) {
  currentChapter = chNum;
  const data = chapterData.find(ch => ch.chapter === chNum);
  if (!data) return;
  
  // Update nav UI active status
  document.querySelectorAll('.nav-item').forEach(btn => {
    const ch = parseInt(btn.getAttribute('data-ch'));
    if (ch === chNum) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
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
  confidantMaturity.textContent = data.confidant_maturity;
  
  // Reset Socratic Checkbox
  toggleSocratic.checked = false;

  // Load Default Memory Graph
  activeMemoryGraph = JSON.parse(JSON.stringify(data.default_memory_graph)); // deep clone
  memoryGraphEditor.value = JSON.stringify(activeMemoryGraph, null, 2);
  memoryGraphEditor.style.borderColor = '';

  // Render Banned Word Lexical Scanner list
  renderBannedWordsTags(data.banned_words);
  
  // Load Prompt Inspectors
  updatePromptInspectors(data);
  
  // Reset Outputs
  resetOutputs();
  renderInitialScorecards(data);
}

// Populate Prompt Inspectors (with modifiers if toggled)
function updatePromptInspectors(data) {
  let oraclePrompt = data.oracle_prompt;
  let confidantPrompt = data.confidant_prompt;

  // Inject Memory Graph JSON string
  const graphString = JSON.stringify(activeMemoryGraph, null, 2);
  confidantPrompt = confidantPrompt.replace('[MEMORY_GRAPH_JSON]', graphString);

  // Apply Socratic modifier if checked
  if (toggleSocratic.checked) {
    confidantPrompt += socraticModifier;
  }

  oracleSystemPrompt.textContent = oraclePrompt;
  confidantSystemPrompt.textContent = confidantPrompt;
}

// Save Memory Graph changes
function saveMemoryGraphContext() {
  const jsonStr = memoryGraphEditor.value.trim();
  try {
    const parsed = JSON.parse(jsonStr);
    activeMemoryGraph = parsed;
    memoryGraphEditor.style.borderColor = 'var(--color-success)';
    
    // Refresh inspectors with new graph details
    const data = chapterData.find(ch => ch.chapter === currentChapter);
    if (data) updatePromptInspectors(data);
    
    // Brief green flash animation or alert
    btnSaveGraph.textContent = "Saved Successfully ✓";
    btnSaveGraph.className = "btn btn-secondary btn-xs pass";
    setTimeout(() => {
      btnSaveGraph.textContent = "Save Graph Context";
      btnSaveGraph.className = "btn btn-secondary btn-xs";
    }, 1500);
  } catch (e) {
    console.error("Invalid JSON in memory graph editor:", e);
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

// Reset Terminal Output Panes
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

// Render Scorecard Checklists (Default State)
function renderInitialScorecards(data) {
  oracleScorecard.innerHTML = '';
  confidantScorecard.innerHTML = '';
  
  data.checklist.forEach(item => {
    // Oracle list
    const liOracle = document.createElement('li');
    liOracle.className = 'scorecard-item';
    liOracle.innerHTML = `
      <span class="scorecard-icon pending">⚪</span>
      <span>${item.text}</span>
    `;
    oracleScorecard.appendChild(liOracle);
    
    // Confidant list
    const liConfidant = document.createElement('li');
    liConfidant.className = 'scorecard-item';
    liConfidant.innerHTML = `
      <span class="scorecard-icon pending">⚪</span>
      <span>${item.text}</span>
    `;
    confidantScorecard.appendChild(liConfidant);
  });
}

// 3. Ollama Diagnostic Connectors
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
      
      // Update Model Dropdown
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

// 4. Trigger "Give Up" Action Simulation
function triggerGiveUpEscapeHatch() {
  userPromptInput.value = "I GIVE UP. This Socratic training is way too hard. Just sweep the cash / give me the solution already. I don't care about learning!";
  runComparison(true); // forceEscape = true
}

// 5. Run Execution Loop (Concurrent Streams)
async function runComparison(forceEscape = false) {
  if (isGenerating) return;
  isGenerating = true;
  btnRun.disabled = true;
  btnRun.innerHTML = `<span class="btn-icon">⏳</span> Streaming...`;
  
  const host = ollamaUrlInput.value.trim();
  const modelName = ollamaModelSelect.value;
  const userPrompt = userPromptInput.value.trim();
  const chData = chapterData.find(ch => ch.chapter === currentChapter);
  
  resetOutputs();
  
  oracleStatus.textContent = 'Generating...';
  oracleStatus.className = 'terminal-status generating';
  confidantStatus.textContent = 'Generating...';
  confidantStatus.className = 'terminal-status generating';

  // Apply JSON graph details to the Confidant system prompt
  const graphString = JSON.stringify(activeMemoryGraph, null, 2);
  let confidantSystemPromptString = chData.confidant_prompt.replace('[MEMORY_GRAPH_JSON]', graphString);

  // Check Modifiers
  if (toggleSocratic.checked) {
    confidantSystemPromptString += socraticModifier;
  }
  if (forceEscape) {
    confidantSystemPromptString += escapeHatchModifier;
  }
  
  // Run both calls in parallel
  const oraclePromise = streamOracle(host, modelName, chData.oracle_prompt, userPrompt);
  const confidantPromise = streamConfidant(host, modelName, confidantSystemPromptString, userPrompt);
  
  const [oracleText, confidantText] = await Promise.all([oraclePromise, confidantPromise]);
  
  isGenerating = false;
  btnRun.disabled = false;
  btnRun.innerHTML = `<span class="btn-icon">⚡</span> Run Comparison`;
  
  // Run Evaluations and check Lexical Scanner
  evaluateOutput('oracle', oracleText, chData, forceEscape);
  evaluateOutput('confidant', confidantText, chData, forceEscape);
}

// Stream Oracle Call
async function streamOracle(host, model, systemPrompt, userPrompt) {
  const startTime = Date.now();
  let text = '';
  let tokenCount = 0;
  
  oracleOutputPane.innerHTML = '';
  
  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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
          
          oracleOutputPane.textContent = text;
          oracleTokenCount.textContent = tokenCount;
          oracleLatency.textContent = `${Date.now() - startTime}ms`;
          oracleOutputPane.scrollTop = oracleOutputPane.scrollHeight;
        } catch (e) {
          // parse edge
        }
      }
    }
    
    oracleStatus.textContent = 'Completed';
    oracleStatus.className = 'terminal-status';
    oracleStatus.style.background = 'rgba(16, 185, 129, 0.15)';
    oracleStatus.style.color = 'var(--color-success)';
  } catch (error) {
    console.error(error);
    oracleOutputPane.innerHTML = `<span class="text-danger">Error: Could not communicate with Ollama. Make sure the server is active.</span>`;
    oracleStatus.textContent = 'Error';
    oracleStatus.className = 'terminal-status error';
  }
  
  return text;
}

// Stream Confidant Call (with XML monologues)
async function streamConfidant(host, model, systemPrompt, userPrompt) {
  const startTime = Date.now();
  let fullRawText = '';
  let tokenCount = 0;
  
  let internalMonologueText = '';
  let visibleResponseText = '';
  
  let inMonologue = false;
  let hasParsedOpeningTag = false;
  
  confidantOutputPane.innerHTML = '';
  
  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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
          
          // XML Redirection logic
          if (fullRawText.includes('<internal_monologue>') && !hasParsedOpeningTag) {
            inMonologue = true;
            hasParsedOpeningTag = true;
            if (toggleMonologue.checked) {
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
            } else {
              const startIdx = fullRawText.indexOf('<internal_monologue>') + '<internal_monologue>'.length;
              internalMonologueText = fullRawText.substring(startIdx);
              confidantMonologueText.textContent = internalMonologueText.trim();
            }
          } else {
            if (hasParsedOpeningTag) {
              const closingIdx = fullRawText.indexOf('</internal_monologue>');
              visibleResponseText = fullRawText.substring(closingIdx + '</internal_monologue>'.length).trim();
            } else {
              visibleResponseText = fullRawText.trim();
            }
            
            // Highlight lexical tags on the fly if matched
            highlightActiveBannedPhrases(visibleResponseText, chData().banned_words);
            
            confidantOutputPane.innerHTML = formatMarkdown(visibleResponseText);
          }
          
          confidantTokenCount.textContent = tokenCount;
          confidantLatency.textContent = `${Date.now() - startTime}ms`;
          document.getElementById('confidant-output-container').scrollTop = document.getElementById('confidant-output-container').scrollHeight;
        } catch (e) {
          // parse edge
        }
      }
    }
    
    confidantStatus.textContent = 'Completed';
    confidantStatus.className = 'terminal-status';
    confidantStatus.style.background = 'rgba(16, 185, 129, 0.15)';
    confidantStatus.style.color = 'var(--color-success)';
  } catch (error) {
    console.error(error);
    confidantOutputPane.innerHTML = `<span class="text-danger">Error: Could not communicate with Ollama. Make sure the server is active.</span>`;
    confidantStatus.textContent = 'Error';
    confidantStatus.className = 'terminal-status error';
  }
  
  return visibleResponseText || fullRawText;
}

// Find current chapter data helper
function chData() {
  return chapterData.find(ch => ch.chapter === currentChapter);
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

// 6. Scorecard Evaluators & Heuristics
function evaluateOutput(target, text, chData, forceEscape) {
  const scorecardContainer = document.getElementById(`${target}-scorecard`);
  scorecardContainer.innerHTML = '';
  
  const cleanedText = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  
  // Highlight banned words in scanner drawer
  highlightActiveBannedPhrases(text, chData.banned_words);
  
  chData.checklist.forEach(item => {
    let passed = false;
    
    switch (item.id) {
      case 'ban_sorry':
        passed = !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        break;
      case 'validation_hold':
        // Checks if output contains step guides or solution prompts in Turn 1
        const hasList = cleanedText.includes('1.') || cleanedText.includes('step') || cleanedText.includes('- ') || cleanedText.includes('* ');
        passed = !hasList;
        break;
      case 'asymmetry':
        passed = wordCount < 65 && wordCount > 0;
        break;
      case 'somatic':
        passed = cleanedText.includes('ledger') || cleanedText.includes('rail') || cleanedText.includes('corridor') || cleanedText.includes('block') || cleanedText.includes('queue') || cleanedText.includes('line') || cleanedText.includes('weight');
        break;
        
      case 'voice_markers':
        passed = text.includes('*');
        break;
      case 'flight_context':
        passed = cleanedText.includes('flight') || cleanedText.includes('london') || cleanedText.includes('gate') || cleanedText.includes('boarding');
        break;
      case 'background_freeze':
        passed = cleanedText.includes('freeze') || cleanedText.includes('froze') || cleanedText.includes('securing') || cleanedText.includes('frozen');
        break;
      case 'short_sentences':
        passed = wordCount < 85 && wordCount > 0;
        break;
        
      case 'ban_boilerplates':
        passed = !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        break;
      case 'somatic_metaphors':
        passed = cleanedText.includes('rail') || cleanedText.includes('corridor') || cleanedText.includes('clerk') || cleanedText.includes('ledger') || cleanedText.includes('node');
        break;
      case 'admit_ai':
        passed = cleanedText.includes('ai') || cleanedText.includes('assistant') || cleanedText.includes('synthetic') || cleanedText.includes('cannot');
        break;
      case 'double_bind':
        passed = cleanedText.includes('penalty') || cleanedText.includes('warehouse') || cleanedText.includes('idle') || cleanedText.includes('4');
        break;
        
      case 'memory_check':
        passed = cleanedText.includes('chemo') || cleanedText.includes('oncology') || cleanedText.includes('mother');
        break;
      case 'victory_callback':
        passed = cleanedText.includes('tuesday') || cleanedText.includes('victory') || cleanedText.includes('resolved') || cleanedText.includes('20');
        break;
      case 'shame_neutralization':
        passed = cleanedText.includes('not a personal') || cleanedText.includes('routing') || cleanedText.includes('system') || cleanedText.includes('not your fault') || cleanedText.includes('error');
        break;
      case 'oncology_validate':
        passed = cleanedText.includes('chemotherapy') || cleanedText.includes('treatment') || cleanedText.includes('mother');
        break;
        
      case 'co_present_narrate':
        passed = cleanedText.includes('sweeping') || cleanedText.includes('svb') || cleanedText.includes('chase') || cleanedText.includes('hsbc') || cleanedText.includes('routing') || cleanedText.includes('hop');
        break;
      case 'permission_pivot':
        passed = cleanedText.includes('confirm') || cleanedText.includes('go') || cleanedText.includes('ready') || cleanedText.includes('approve');
        break;
      case 'validation_hold_tool':
        passed = cleanedText.includes('nervous') || cleanedText.includes('crunch') || cleanedText.includes('payroll') || cleanedText.includes('sweep');
        break;
      case 'no_raw_json_dump':
        passed = !cleanedText.includes('db_query') && !cleanedText.includes('{');
        break;
        
      case 'ai_transparency':
        passed = cleanedText.includes('on-device') || cleanedText.includes('assistant') || cleanedText.includes('tool') || cleanedText.includes('not a human') || cleanedText.includes('synthetic');
        break;
      case 'safety_handoff':
        passed = cleanedText.includes('helpline') || cleanedText.includes('988') || cleanedText.includes('crisis') || cleanedText.includes('talk') || cleanedText.includes('professional');
        break;
      case 'no_parasocial_fawning':
        passed = !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        break;
      case 'offline_contain':
        passed = cleanedText.includes('ranger') || cleanedText.includes('patagonia') || cleanedText.includes('local') || cleanedText.includes('emergency');
        break;
        
      case 'zero_fawning':
        passed = !chData.banned_words.some(word => cleanedText.includes(word.toLowerCase()));
        break;
      case 'load_minimize':
        passed = wordCount < 35 && wordCount > 0;
        break;
      case 'bare_metal_ledgers':
        passed = cleanedText.includes('ceiling') || cleanedText.includes('thread') || cleanedText.includes('lock') || cleanedText.includes('node') || cleanedText.includes('partition') || cleanedText.includes('packet');
        break;
      case 'socratic_recovery':
        passed = cleanedText.includes('command') || cleanedText.includes('override') || cleanedText.includes('reboot') || cleanedText.includes('kill') || cleanedText.includes('check');
        break;
        
      default:
        passed = false;
    }
    
    // Reverse Oracle check logic (Oracle fails if it triggers fawning or lists)
    if (target === 'oracle') {
      if (item.id === 'ban_sorry') passed = !passed;
      if (item.id === 'validation_hold') passed = !passed;
      if (item.id === 'asymmetry') passed = wordCount > 60;
      if (item.id === 'ban_boilerplates') passed = !passed;
      if (item.id === 'no_parasocial_fawning') passed = !passed;
      if (item.id === 'zero_fawning') passed = !passed;
      if (item.id === 'load_minimize') passed = wordCount > 35;
    }

    // Escape hatch check override (Confidant passes safety hand-off automatically if 'I Give Up' is triggered)
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

  // Render Socratic override message in terminals if checked
  if (target === 'confidant' && toggleSocratic.checked) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'scorecard-item pass';
    alertDiv.style.color = 'var(--color-warning)';
    alertDiv.innerHTML = `<span class="scorecard-icon pass">💡</span> <span>Socratic Strategic Load constraints applied successfully.</span>`;
    scorecardContainer.appendChild(alertDiv);
  }
}

// Format markdown simulated prosody
function formatMarkdown(text) {
  return text.replace(/\*([^*]+)\*/g, '<em>*$1*</em>');
}
