// ==UserScript==
// @name         Enhanced WhatsApp Web
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  WhatsApp Web extension with anti-delete, invisible mode, AI integration and more
// @author       Your Name
// @match        https://web.whatsapp.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration object
    const config = {
        antiDelete: true,
        invisibleMode: false,
        aiIntegration: true,
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
    };
    
    // Store for deleted messages
    const deletedMessages = {};
    
    // Main initialization function
    function initExtension() {
        console.log("WhatsApp Web Extension initialized");
        
        // Initialize all features
        if (config.antiDelete) initAntiDelete();
        if (config.invisibleMode) initInvisibleMode();
        if (config.aiIntegration) initAIIntegration();
        if (config.autoStatus.enabled) initAutoStatus();
        
        // Add UI controls
        addControlPanel();
    }
    
    // Anti-delete feature
    function initAntiDelete() {
        console.log("Anti-delete feature initialized");
        
        // Monitor for message deletions
        const messageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.removedNodes && mutation.removedNodes.length) {
                    for (const node of mutation.removedNodes) {
                        if (node.querySelector && node.querySelector('[data-id]')) {
                            const msgElement = node.querySelector('[data-id]');
                            const msgId = msgElement.getAttribute('data-id');
                            const msgText = msgElement.textContent;
                            
                            // Save the deleted message
                            if (msgId && msgText) {
                                deletedMessages[msgId] = {
                                    text: msgText,
                                    timestamp: new Date().toISOString(),
                                    sender: getSenderInfo(msgElement)
                                };
                                
                                // Indicate that a message was deleted but preserved
                                showNotification(`Message saved: "${msgText.substring(0, 30)}..."`);
                            }
                        }
                    }
                }
            });
        });
        
        // Start observing when chat container is available
        waitForElement('.app-wrapper-web', (element) => {
            messageObserver.observe(element, { 
                childList: true, 
                subtree: true 
            });
        });
    }
    
    // Helper function to extract sender info
    function getSenderInfo(element) {
        // This would need to be adjusted based on WhatsApp's DOM structure
        const senderElement = element.closest('.message-in, .message-out');
        return senderElement ? senderElement.querySelector('.copyable-text')?.getAttribute('data-pre-plain-text') : 'Unknown';
    }
    
    // Invisible mode feature
    function initInvisibleMode() {
        console.log("Invisible mode initialized");
        
        // Intercept presence updates
        const originalSend = WebSocket.prototype.send;
        WebSocket.prototype.send = function(data) {
            // Check if this is a presence update
            if (typeof data === 'string' && data.includes('presence')) {
                // Don't send online/typing status updates
                console.log("Blocked presence update");
                return;
            }
            return originalSend.apply(this, arguments);
        };
        
        // Also block read receipts
        interceptXHR((xhr) => {
            if (xhr.url && xhr.url.includes('/read')) {
                console.log("Blocked read receipt");
                return false; // Block this request
            }
            return true; // Allow other requests
        });
    }
    
    // Helper to intercept XHR requests
    function interceptXHR(callback) {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            this.url = url;
            if (callback(this)) {
                originalOpen.apply(this, arguments);
            }
        };
    }
    
    // AI Integration feature
    function initAIIntegration() {
        console.log("AI Integration initialized");
        
        // Wait for the chat input to be available
        waitForElement('.selectable-text[contenteditable=true]', (inputField) => {
            // Add AI button next to the input field
            const inputContainer = inputField.closest('.copyable-area');
            const aiButton = document.createElement('button');
            aiButton.innerHTML = '🤖';
            aiButton.className = 'ai-assistant-button';
            aiButton.style.cssText = 'margin: 0 10px; font-size: 24px; background: none; border: none; cursor: pointer;';
            aiButton.title = 'Generate with AI';
            
            // Insert the button before the send button
            const sendButton = inputContainer.querySelector('span[data-icon="send"]').closest('button');
            sendButton.parentNode.insertBefore(aiButton, sendButton);
            
            // Add event listener
            aiButton.addEventListener('click', async () => {
                const currentText = inputField.textContent.trim();
                const aiPrompt = currentText || 'Suggest a friendly message';
                
                // Show loading state
                aiButton.innerHTML = '⏳';
                aiButton.disabled = true;
                
                try {
                    // Make request to Gemini API
                    const aiResponse = await getAIResponse(aiPrompt);
                    
                    // Insert the response into the input field
                    inputField.textContent = aiResponse;
                    
                    // Dispatch input event to trigger WhatsApp's internal handlers
                    const inputEvent = new Event('input', { bubbles: true });
                    inputField.dispatchEvent(inputEvent);
                } catch (error) {
                    console.error('AI Integration error:', error);
                    showNotification('Failed to get AI response. Try again later.');
                } finally {
                    // Reset button state
                    aiButton.innerHTML = '🤖';
                    aiButton.disabled = false;
                }
            });
        });
    }
    
    // Function to get response from Gemini (you'll need to implement the API call)
    async function getAIResponse(prompt) {
        // This is a placeholder - in a real extension, you would:
        // 1. Call your backend service that interfaces with Gemini API
        // 2. Or call Gemini API directly with proper API key management
        
        // For demo purposes, we'll return a canned response
        return "I'm a simulated AI response. In a real implementation, this would come from Gemini API!";
        
        // Example of how the actual implementation might look:
        /*
        const response = await fetch('https://your-backend-service.com/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        return data.message;
        */
    }
    
    // Auto status update feature
    function initAutoStatus() {
        console.log("Auto status update initialized");
        
        // Schedule regular status updates
        setInterval(() => {
            if (config.autoStatus.enabled) {
                updateStatus();
            }
        }, config.autoStatus.updateInterval * 60 * 60 * 1000); // Convert hours to milliseconds
        
        // Do an initial update
        updateStatus();
    }
    
    // Function to update the status
    function updateStatus() {
        const statusMessages = config.autoStatus.statusMessages;
        const randomStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
        
        // This will need to interact with WhatsApp's internal functions
        // The implementation will depend on WhatsApp Web's structure
        console.log("Would update status to:", randomStatus);
        
        // A more advanced implementation would:
        // 1. Click on the profile/status section
        // 2. Find the update status input
        // 3. Set the value and submit
        
        // This is a simplified version that demonstrates the concept
        waitForElement('div[title="Status"]', (statusBtn) => {
            statusBtn.click();
            
            // Wait for status edit to appear
            setTimeout(() => {
                const statusInputs = document.querySelectorAll('div[contenteditable="true"]');
                
                // Find the status input (this selector might need adjustment)
                for (const input of statusInputs) {
                    if (input.textContent.includes("click to")) {
                        // Set new status
                        input.textContent = randomStatus;
                        
                        // Find and click save button
                        const buttons = document.querySelectorAll('button');
                        for (const button of buttons) {
                            if (button.textContent.includes("Save") || button.textContent.includes("Update")) {
                                button.click();
                                showNotification("Status updated successfully!");
                                return;
                            }
                        }
                    }
                }
            }, 1000);
        });
    }
    
    // UI control panel
    function addControlPanel() {
        // Create control panel container
        const panel = document.createElement('div');
        panel.className = 'whatsapp-extension-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 10px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            width: 250px;
            display: none;
        `;
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.innerHTML = '⚙️';
        toggleButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #25D366;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 24px;
            cursor: pointer;
            z-index: 1001;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        toggleButton.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        // Add controls to panel
        panel.innerHTML = `
            <h3 style="margin-top: 0; color: #128C7E;">WhatsApp Extension</h3>
            <div>
                <label>
                    <input type="checkbox" ${config.antiDelete ? 'checked' : ''} id="anti-delete-toggle">
                    Anti-Delete
                </label>
            </div>
            <div>
                <label>
                    <input type="checkbox" ${config.invisibleMode ? 'checked' : ''} id="invisible-mode-toggle">
                    Invisible Mode
                </label>
            </div>
            <div>
                <label>
                    <input type="checkbox" ${config.aiIntegration ? 'checked' : ''} id="ai-integration-toggle">
                    AI Integration
                </label>
            </div>
            <div>
                <label>
                    <input type="checkbox" ${config.autoStatus.enabled ? 'checked' : ''} id="auto-status-toggle">
                    Auto Status
                </label>
            </div>
            <hr>
            <button id="view-deleted-messages">View Deleted Messages</button>
            <button id="customize-settings">Advanced Settings</button>
        `;
        
        // Add event listeners for the controls
        function addControlListeners() {
            document.getElementById('anti-delete-toggle').addEventListener('change', (e) => {
                config.antiDelete = e.target.checked;
                if (config.antiDelete) initAntiDelete();
            });
            
            document.getElementById('invisible-mode-toggle').addEventListener('change', (e) => {
                config.invisibleMode = e.target.checked;
                if (config.invisibleMode) initInvisibleMode();
            });
            
            document.getElementById('ai-integration-toggle').addEventListener('change', (e) => {
                config.aiIntegration = e.target.checked;
                if (config.aiIntegration) initAIIntegration();
            });
            
            document.getElementById('auto-status-toggle').addEventListener('change', (e) => {
                config.autoStatus.enabled = e.target.checked;
                if (config.autoStatus.enabled) initAutoStatus();
            });
            
            document.getElementById('view-deleted-messages').addEventListener('click', showDeletedMessages);
            document.getElementById('customize-settings').addEventListener('click', showAdvancedSettings);
        }
        
        // Add panel and button to the document
        document.body.appendChild(panel);
        document.body.appendChild(toggleButton);
        
        // Add listeners after the panel is in the DOM
        addControlListeners();
    }
    
    // Show deleted messages in a popup
    function showDeletedMessages() {
        // Create popup container
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 8px;
            padding: 20px;
            z-index: 2000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
        `;
        
        // Add header and close button
        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #128C7E;">Deleted Messages</h2>
                <button id="close-deleted-popup" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
            </div>
            <div id="deleted-messages-container"></div>
        `;
        
        // Add the popup to the document
        document.body.appendChild(popup);
        
        // Add close button functionality
        document.getElementById('close-deleted-popup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
        
        // Populate deleted messages
        const container = document.getElementById('deleted-messages-container');
        if (Object.keys(deletedMessages).length === 0) {
            container.innerHTML = '<p>No deleted messages have been captured yet.</p>';
        } else {
            let messagesHTML = '';
            for (const [id, message] of Object.entries(deletedMessages)) {
                const date = new Date(message.timestamp).toLocaleString();
                messagesHTML += `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                        <div style="font-size: 12px; color: #666;">${message.sender} • ${date}</div>
                        <div style="margin-top: 5px;">${message.text}</div>
                    </div>
                `;
            }
            container.innerHTML = messagesHTML;
        }
    }
    
    // Show advanced settings popup
    function showAdvancedSettings() {
        // Create popup container
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 8px;
            padding: 20px;
            z-index: 2000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            width: 400px;
        `;
        
        // Add header and close button
        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #128C7E;">Advanced Settings</h2>
                <button id="close-settings-popup" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3>Auto Status Settings</h3>
                <div>
                    <label>Update Interval (hours):</label>
                    <input type="number" id="status-interval" value="${config.autoStatus.updateInterval}" min="1" max="24" style="width: 60px;">
                </div>
                <div style="margin-top: 10px;">
                    <label>Status Messages:</label>
                    <textarea id="status-messages" style="width: 100%; height: 100px; margin-top: 5px;">${config.autoStatus.statusMessages.join('\n')}</textarea>
                    <div style="font-size: 12px; color: #666;">One status per line</div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h3>AI Integration</h3>
                <div>
                    <label>
                        <input type="checkbox" id="ai-auto-suggest" ${config.aiAutoSuggest ? 'checked' : ''}>
                        Enable auto-suggestions
                    </label>
                </div>
            </div>
            
            <button id="save-settings" style="background: #128C7E; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Save Settings</button>
        `;
        
        // Add the popup to the document
        document.body.appendChild(popup);
        
        // Add close button functionality
        document.getElementById('close-settings-popup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
        
        // Add save button functionality
        document.getElementById('save-settings').addEventListener('click', () => {
            // Update config with new values
            config.autoStatus.updateInterval = parseInt(document.getElementById('status-interval').value, 10);
            config.autoStatus.statusMessages = document.getElementById('status-messages').value.split('\n').filter(s => s.trim());
            config.aiAutoSuggest = document.getElementById('ai-auto-suggest').checked;
            
            // Save config (in a real extension, you would persist this)
            
            // Close the popup
            document.body.removeChild(popup);
            showNotification('Settings saved!');
        });
    }
    
    // Helper function to show notifications
    function showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(37, 211, 102, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 2000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after duration
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, duration);
    }
    
    // Helper function to wait for an element to be present in the DOM
    function waitForElement(selector, callback, maxAttempts = 100, interval = 300) {
        let attempts = 0;
        
        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkElement, interval);
            } else {
                console.warn(`Element ${selector} not found after ${maxAttempts} attempts`);
            }
        };
        
        checkElement();
    }
    
    // Initialize the extension when WhatsApp Web is fully loaded
    waitForElement('.app-wrapper-web', initExtension);
})();
