// Listen for the user clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  console.log("👵 Grandma Mode Activated on:", tab.url);

  // 1. Capture the visible tab as an image
  chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 50 }, (dataUrl) => {
    
    if (chrome.runtime.lastError) {
      console.error("Capture failed:", chrome.runtime.lastError.message);
      return;
    }

    // 2. Send the image to your Local Python Backend
    fetch("http://127.0.0.1:8000/simplify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image_data: dataUrl })
    })
    .then(response => response.json())
    .then(data => {
      console.log("✅ Backend Response:", data);
      
      // 3. Send the result to the Content Script (to draw the UI)
      chrome.tabs.sendMessage(tab.id, { 
        action: "DRAW_UI", 
        data: data 
      });
    })
    .catch(error => console.error("❌ Backend Error:", error));
  });
});