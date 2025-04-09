// background.js - Service worker for WhatsApp Web Enhancer

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Set default configuration
    chrome.storage.sync.set({
      antiDelete: true,
      invisibleMode: false,
      aiIntegration: true,
      geminiApiKey: '', // User will need to provide this
      autoStatus: {
        enabled: false,
        updateInterval: 12, // hours
        statusMessages: [
          "Working hard or hardly working?",
          "Available for chat!",
          "Busy day ahead",
          "Taking some time off"
        ]
      }
    });
    console.log('WhatsApp Web Enhancer installed with default settings');
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message based on type
  switch (message.type) {
    case 'getSettings':
      // Retrieve settings from storage and send back
      chrome.storage.sync.get(null, (data) => {
        sendResponse({ success: true, settings: data });
      });
      return true; // Required for async response

    case 'saveSettings':
      // Save new settings to storage
      chrome.storage.sync.set(message.settings, () => {
        sendResponse({ success: true });
      });
      return true; // Required for async response

    case 'fetchGeminiResponse':
      // Call Gemini API with the provided prompt
      const apiKey = message.apiKey;
      const prompt = message.prompt;
      
      if (!apiKey) {
        sendResponse({ 
          success: false, 
          error: 'API key not provided. Please set your Gemini API key in the extension settings.' 
        });
        return true;
      }
      
      // Make API call to Gemini
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const responseText = data.candidates[0].content.parts[0].text;
          sendResponse({ success: true, response: responseText });
        } else {
          sendResponse({ 
            success: false, 
            error: 'Invalid API response format', 
            rawResponse: data 
          });
        }
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to fetch response from Gemini API' 
        });
      });
      
      return true; // Required for async response

    case 'logDeletedMessage':
      // Store deleted message in local storage
      chrome.storage.local.get('deletedMessages', ({ deletedMessages = {} }) => {
        deletedMessages[message.messageId] = {
          text: message.text,
          sender: message.sender,
          timestamp: message.timestamp || new Date().toISOString(),
          chatId: message.chatId
        };
        
        // Save updated deleted messages
        chrome.storage.local.set({ deletedMessages }, () => {
          sendResponse({ success: true });
        });
      });
      return true; // Required for async response

    case 'getDeletedMessages':
      // Retrieve all deleted messages
      chrome.storage.local.get('deletedMessages', (data) => {
        sendResponse({ 
          success: true, 
          messages: data.deletedMessages || {} 
        });
      });
      return true; // Required for async response
  }
});

// Optional: Add listener for web requests to monitor WhatsApp Web API calls
// This can be useful for more advanced features
/*
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Monitor specific types of requests
    if (details.url.includes('web.whatsapp.com/') && details.url.includes('presence')) {
      console.log('Presence update request detected');
      // Could modify or block if needed
    }
  },
  { urls: ["https://web.whatsapp.com/*"] }
);
*/
