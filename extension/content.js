console.log("👵 Grandma Mode Content Script Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DRAW_UI") {
    
    // 1. Check if data exists
    if (!request.data || !request.data.data) {
      alert("Error: No data received from Brain.");
      return;
    }

    const aiResponse = request.data.data; // This is the JSON from Gemini
    console.log("🎨 Drawing UI for:", aiResponse.page_summary);

    createGrandmaOverlay(aiResponse);
  }
});

function createGrandmaOverlay(data) {
  // Remove existing overlay if present
  const existing = document.getElementById("grandma-overlay");
  if (existing) existing.remove();

  // 1. Create the Main Curtain
  const overlay = document.createElement("div");
  overlay.id = "grandma-overlay";

  // 2. Create Header
  const header = document.createElement("h1");
  header.id = "grandma-header";
  header.innerText = data.page_summary;
  overlay.appendChild(header);

  // 3. Create Container for Buttons
  const btnContainer = document.createElement("div");
  btnContainer.id = "grandma-buttons";

  // 4. Generate Big Buttons
  data.primary_actions.forEach(action => {
    const btn = document.createElement("button");
    btn.className = "grandma-btn";
    btn.innerText = action.label;
    
    // Click Listener: Uses the shared helper function
    btn.onclick = () => activateFeature(action.visual_clue);

    btnContainer.appendChild(btn);
  });

  overlay.appendChild(btnContainer);

  // 5. Add Microphone Button (Voice Control)
  const micBtn = document.createElement("button");
  micBtn.id = "grandma-mic";
  micBtn.innerHTML = "🎤"; 
  micBtn.title = "Click and say a command";
  
  // Voice Listener
  micBtn.onclick = () => startListening(data.primary_actions);
  
  overlay.appendChild(micBtn);

  // 6. Add Exit Button
  const closeBtn = document.createElement("button");
  closeBtn.id = "grandma-close";
  closeBtn.innerText = "Exit";
  closeBtn.onclick = () => overlay.remove();
  overlay.appendChild(closeBtn);

  // 7. Inject into the page
  document.body.appendChild(overlay);
}

// --- SHARED HELPER: Finds and Clicks the Element ---
function activateFeature(visualClue) {
  console.log(`🔎 Searching for element matching: "${visualClue}"`);
      
  const clue = visualClue.toLowerCase();
  
  // We look at ALL clickable things, plus Inputs
  const allElements = document.querySelectorAll('a, button, input, [role="button"], [role="link"]');
  let foundElement = null;

  for (let el of allElements) {
    // 1. Check Visible Text
    const textMatch = el.innerText && el.innerText.toLowerCase().includes(clue);
    
    // 2. Check "Value" (For <input type="submit" value="Search">)
    const valueMatch = el.value && el.value.toLowerCase().includes(clue);
    
    // 3. Check Accessibility Labels (For Icon Buttons like 🔍)
    const ariaMatch = el.getAttribute('aria-label') && el.getAttribute('aria-label').toLowerCase().includes(clue);
    
    // 4. Check Placeholder (For Search Boxes)
    const placeholderMatch = el.getAttribute('placeholder') && el.getAttribute('placeholder').toLowerCase().includes(clue);

    if (textMatch || valueMatch || ariaMatch || placeholderMatch) {
        foundElement = el;
        break; 
    }
  }

  if (foundElement) {
    console.log("✅ Found it!", foundElement);
    
    // Remove overlay so the user can see the result
    const overlay = document.getElementById("grandma-overlay");
    if (overlay) overlay.remove();
    
    // If it's a search box, Focus it. If it's a button, Click it.
    foundElement.click();
    foundElement.focus(); 
  } else {
    alert(`❌ I couldn't find a button or input labeled "${visualClue}".\nTry checking the console for what I saw.`);
  }
}

// --- VOICE LOGIC ---
function startListening(actions) {
  const micBtn = document.getElementById("grandma-mic");
  
  // Check if browser supports speech
  if (!('webkitSpeechRecognition' in window)) {
    alert("Sorry, your browser doesn't support Voice Control.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => {
    micBtn.classList.add("listening");
    micBtn.innerHTML = "👂"; // Change icon to Ear
  };

  recognition.onend = () => {
    micBtn.classList.remove("listening");
    micBtn.innerHTML = "🎤"; // Change back to Mic
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    console.log("🗣️ Voice Command Received:", transcript);
    
    // Fuzzy Match: Check if the spoken word matches any button label
    const matchedAction = actions.find(action => 
      transcript.includes(action.label.toLowerCase())
    );

    if (matchedAction) {
      // SUCCESS: Reuse the exact same function that the click uses!
      activateFeature(matchedAction.visual_clue);
    } else {
      alert(`I heard "${transcript}", but I don't see a button for that.`);
    }
  };

  recognition.start();
}