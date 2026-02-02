console.log("👵 Grandma Mode: Pro Engine Loaded");

// --- 1. LISTEN FOR MESSAGES ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DRAW_UI") {
    if (!request.data || !request.data.data) {
      alert("Backend Error: Empty Data");
      return;
    }
    createProOverlay(request.data.data);
  }
});

// --- 2. UI BUILDER ---
function createProOverlay(data) {
  const existing = document.getElementById("grandma-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "grandma-overlay";

  // Progress Bar
  const loader = document.createElement("div");
  loader.id = "grandma-loader";
  loader.innerHTML = '<div class="bar"></div>';
  overlay.appendChild(loader);

  // Header
  const header = document.createElement("h1");
  header.id = "grandma-header";
  header.innerText = data.page_summary;
  overlay.appendChild(header);

  // Buttons Container
  const btnContainer = document.createElement("div");
  btnContainer.id = "grandma-buttons";

  data.primary_actions.forEach(action => {
    const btn = document.createElement("button");
    btn.className = "grandma-btn";
    
    // Icon Logic (Simple mapping)
    const iconMap = { "search": "🔍", "login": "👤", "book": "📖", "cart": "🛒", "menu": "☰" };
    const iconChar = iconMap[action.icon_name] || "⚡";
    
    btn.innerHTML = `<span class="grandma-icon">${iconChar}</span> ${action.label}`;
    
    // Click Handler -> Starts Search Engine
    btn.onclick = () => {
        showLoading(true);
        // Slight delay to let UI update
        setTimeout(() => runFuzzySearch(action), 50); 
    };

    btnContainer.appendChild(btn);
  });
  overlay.appendChild(btnContainer);

  // Mic Button
  const micBtn = document.createElement("button");
  micBtn.id = "grandma-mic";
  micBtn.innerHTML = "🎙️";
  micBtn.onclick = () => startVoice(data.primary_actions);
  overlay.appendChild(micBtn);

  // Close Button
  const closeBtn = document.createElement("button");
  closeBtn.id = "grandma-close";
  closeBtn.innerText = "Exit Mode";
  closeBtn.onclick = () => overlay.remove();
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);
}

function showLoading(show) {
  const loader = document.getElementById("grandma-loader");
  if(loader) loader.style.display = show ? "block" : "none";
}

// --- 3. PROFESSIONAL GRADE SEARCH ENGINE ---
function runFuzzySearch(action) {
  console.log(`🧠 AI Engine: Deep Scan for "${action.label}"...`);
  
  // 1. SELECT EVERYTHING (The "Dragnet" Approach)
  // We include spans and divs because sometimes buttons are faked with divs
  const candidates = document.querySelectorAll('a, button, input, textarea, [role="button"], [role="link"], [tabindex="0"], span, div');
  
  let bestEl = null;
  let maxScore = 0;

  // 2. SCORING ALGORITHM V2
  candidates.forEach(el => {
    // Optimization: Skip elements that are obviously not interactive or invisible
    if (!el.offsetParent) return; 
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return; // Too small to be a button

    let score = 0;
    
    // Gather all text signals
    const text = (el.innerText || el.value || "").toLowerCase().trim();
    const id = (el.id || "").toLowerCase();
    const classes = (el.className && typeof el.className === 'string' ? el.className : "").toLowerCase();
    const aria = (el.getAttribute("aria-label") || "").toLowerCase();
    const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
    const role = (el.getAttribute("role") || "").toLowerCase();
    const type = (el.getAttribute("type") || "").toLowerCase();

    // MATCHING LOGIC
    action.keywords.forEach(kw => {
        const k = kw.toLowerCase();
        
        // Tier 1: Exact High-Confidence Matches (+30)
        if (text === k) score += 30;
        if (id === k) score += 30;
        if (aria === k) score += 30;

        // Tier 2: Strong Partial Matches (+15)
        if (text.includes(k) && text.length < 50) score += 15; // Only if text isn't a whole paragraph
        if (id.includes(k)) score += 15;
        if (placeholder.includes(k)) score += 15;
        
        // Tier 3: Weak Signals (+5)
        if (classes.includes(k)) score += 5;
    });

    // BONUS POINTS for being a "Real" interactive element
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT') score += 10;
    if (role === 'button' || role === 'link') score += 10;
    if (type === 'submit' || type === 'search') score += 10;
    if (getComputedStyle(el).cursor === 'pointer') score += 5;

    // UPDATE LEADER
    if (score > maxScore) {
        maxScore = score;
        bestEl = el;
    }
  });

  // 3. RESULT HANDLER
  showLoading(false);

  // Lowered threshold to 15 to be more forgiving
  if (bestEl && maxScore >= 15) {
    console.log(`✅ FOUND: "${action.label}" (Score: ${maxScore})`, bestEl);
    
    // VISUAL CONFIRMATION
    const originalStyle = bestEl.style.outline;
    bestEl.style.outline = "4px solid #ea4335"; 
    bestEl.style.outlineOffset = "2px";
    
    bestEl.scrollIntoView({behavior: "smooth", block: "center"});

    setTimeout(() => {
        bestEl.style.outline = originalStyle; // Cleanup
        
        // Close Overlay
        const overlay = document.getElementById("grandma-overlay");
        if (overlay) overlay.remove(); 
        
        // SMART INTERACTION
        // If AI said it's an INPUT, or if the HTML tag is clearly an input
        if (action.type === "input" || bestEl.tagName === "INPUT" || bestEl.tagName === "TEXTAREA") {
            bestEl.focus();
            bestEl.select();
        } else {
            bestEl.click();
        }
    }, 800); 

    return true;

  } else {
    // FAIL SAFE: If we fail, log the top keywords we tried so you can debug
    console.warn("❌ FAILED. Tried keywords:", action.keywords);
    alert(`I searched for "${action.label}" but couldn't find a clear match.\n\n(Score was ${maxScore}, needed 15)`);
    return false;
  }
}
// --- 4. VOICE CONTROL ---
function startVoice(actions) {
  const micBtn = document.getElementById("grandma-mic");
  if (!('webkitSpeechRecognition' in window)) { alert("No Voice Support"); return; }
  
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US'; 
  
  recognition.onstart = () => micBtn.classList.add("listening");
  recognition.onend = () => micBtn.classList.remove("listening");
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("🗣️ Voice:", transcript);

    // Find action where the label matches the voice
    const match = actions.find(a => transcript.includes(a.label.toLowerCase()));

    if (match) {
        showLoading(true);
        setTimeout(() => runFuzzySearch(match), 100);
    } else {
        alert("I didn't catch that.");
    }
  };
  recognition.start();
}