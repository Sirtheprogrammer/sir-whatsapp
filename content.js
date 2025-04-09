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
    
    // Feature states
    let features = {
        antiDelete: false,
        invisibleMode: false,
        aiAssistant: false,
        messageScheduler: false,
        autoReply: false,
        messageFilter: false,
        chatBackup: false,
        messageSearch: false,
        messageStats: false,
        quickReplies: false
    };
    
    // Load saved states
    chrome.storage.sync.get(features, (result) => {
        features = result;
        initializeFeatures();
    });
    
    // Listen for feature toggles from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'TOGGLE_FEATURE') {
            features[message.feature] = message.enabled;
            handleFeatureToggle(message.feature, message.enabled);
        }
    });
    
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
    
    // Initialize features
    function initializeFeatures() {
        if (features.antiDelete) enableAntiDelete();
        if (features.invisibleMode) enableInvisibleMode();
        if (features.aiAssistant) enableAIAssistant();
        if (features.messageScheduler) enableMessageScheduler();
        if (features.autoReply) enableAutoReply();
        if (features.messageFilter) enableMessageFilter();
        if (features.chatBackup) enableChatBackup();
        if (features.messageSearch) enableAdvancedSearch();
        if (features.messageStats) enableMessageStats();
        if (features.quickReplies) enableQuickReplies();
        initStatusFeatures(); // Add status features initialization
    }
    
    // Handle feature toggles
    function handleFeatureToggle(feature, enabled) {
        switch (feature) {
            case 'antiDelete':
                enabled ? enableAntiDelete() : disableAntiDelete();
                break;
            case 'invisibleMode':
                enabled ? enableInvisibleMode() : disableInvisibleMode();
                break;
            // Add other features...
        }
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
    
    // Function to get response from Gemini
    async function getAIResponse(prompt) {
        try {
            // Get API key and model from storage
            const { geminiApiKey, aiModel } = await new Promise((resolve) => {
                chrome.storage.sync.get(['geminiApiKey', 'aiModel'], resolve);
            });

            if (!geminiApiKey) {
                throw new Error('API key not configured. Please add your Gemini API key in settings.');
            }

            // Gemini API endpoint
            const endpoint = `https://generativelanguage.googleapis.com/v1/models/${aiModel || 'gemini-pro'}:generateContent`;
            
            const response = await fetch(`${endpoint}?key=${geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format from AI');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('AI Integration error:', error);
            showNotification(error.message);
            return null;
        }
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
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        // Add header and close button
        popup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #128C7E;">Advanced Settings</h2>
                <button id="close-settings-popup" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>API Configuration</h3>
                <div style="margin-bottom: 15px;">
                    <label for="gemini-api-key">Gemini API Key:</label>
                    <div style="display: flex; gap: 5px; margin-top: 5px;">
                        <input type="password" id="gemini-api-key" style="flex: 1; padding: 8px;" placeholder="Enter your Gemini API key">
                        <button id="toggle-api-key" style="background: none; border: 1px solid #ccc; padding: 0 10px; cursor: pointer;">👁️</button>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        Required for AI integration features
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>
                        <input type="checkbox" id="ai-auto-suggest" ${config.aiAutoSuggest ? 'checked' : ''}>
                        Enable AI auto-suggestions
                    </label>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="ai-model">AI Model:</label>
                    <select id="ai-model" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
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
            
            <button id="save-settings" style="background: #128C7E; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%;">Save Settings</button>
        `;
        
        // Add the popup to the document
        document.body.appendChild(popup);
        
        // Add toggle API key visibility functionality
        const apiKeyInput = document.getElementById('gemini-api-key');
        const toggleButton = document.getElementById('toggle-api-key');
        
        // Load saved API key
        chrome.storage.sync.get(['geminiApiKey', 'aiModel'], (result) => {
            if (result.geminiApiKey) {
                apiKeyInput.value = result.geminiApiKey;
            }
            if (result.aiModel) {
                document.getElementById('ai-model').value = result.aiModel;
            }
        });
        
        toggleButton.addEventListener('click', () => {
            const type = apiKeyInput.type;
            apiKeyInput.type = type === 'password' ? 'text' : 'password';
            toggleButton.textContent = type === 'password' ? '👁️‍🗨️' : '👁️';
        });
        
        // Add close button functionality
        document.getElementById('close-settings-popup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
        
        // Add save button functionality
        document.getElementById('save-settings').addEventListener('click', () => {
            // Get values from form
            const apiKey = document.getElementById('gemini-api-key').value;
            const aiModel = document.getElementById('ai-model').value;
            const aiAutoSuggest = document.getElementById('ai-auto-suggest').checked;
            const statusInterval = parseInt(document.getElementById('status-interval').value, 10);
            const statusMessages = document.getElementById('status-messages').value.split('\n').filter(s => s.trim());
            
            // Update config
            config.aiAutoSuggest = aiAutoSuggest;
            config.autoStatus.updateInterval = statusInterval;
            config.autoStatus.statusMessages = statusMessages;
            
            // Save to chrome.storage
            chrome.storage.sync.set({
                geminiApiKey: apiKey,
                aiModel: aiModel,
                aiAutoSuggest: aiAutoSuggest,
                autoStatus: {
                    updateInterval: statusInterval,
                    statusMessages: statusMessages
                }
            }, () => {
                // Close the popup
                document.body.removeChild(popup);
                showNotification('Settings saved successfully!');
                
                // Reinitialize AI features if API key is present
                if (apiKey && config.aiIntegration) {
                    initAIIntegration();
                }
            });
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
    
    // Initialize status features
    function initStatusFeatures() {
        // Wait for status container to be available
        waitForElement('div[data-animate-status-viewer="true"]', (statusContainer) => {
            // Add download button and reaction emojis to each status
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(() => {
                    addStatusControls();
                });
            });

            observer.observe(statusContainer, {
                childList: true,
                subtree: true
            });

            // Initial addition of controls
            addStatusControls();
        });
    }

    // Add status controls (download button and reactions)
    function addStatusControls() {
        // Find all status items that don't have our controls
        const statusItems = document.querySelectorAll('div[data-animate-status-viewer="true"] div[data-testid="status-container"]');
        
        statusItems.forEach(statusItem => {
            if (!statusItem.querySelector('.status-controls')) {
                // Create controls container
                const controlsContainer = document.createElement('div');
                controlsContainer.className = 'status-controls';
                
                // Add download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'status-download-btn';
                downloadBtn.innerHTML = '⬇️';
                downloadBtn.title = 'Download Status';
                downloadBtn.onclick = (e) => {
                    e.stopPropagation();
                    downloadStatus(statusItem);
                };
                
                // Add reaction emojis
                const reactions = ['❤️', '😍', '😮', '😂', '😢', '🙏'];
                const reactionContainer = document.createElement('div');
                reactionContainer.className = 'status-reactions';
                
                reactions.forEach(emoji => {
                    const reactionBtn = document.createElement('button');
                    reactionBtn.className = 'status-reaction-btn';
                    reactionBtn.innerHTML = emoji;
                    reactionBtn.onclick = (e) => {
                        e.stopPropagation();
                        reactToStatus(statusItem, emoji);
                    };
                    reactionContainer.appendChild(reactionBtn);
                });
                
                // Add controls to status
                controlsContainer.appendChild(downloadBtn);
                controlsContainer.appendChild(reactionContainer);
                statusItem.appendChild(controlsContainer);
            }
        });
    }

    // Download status media
    async function downloadStatus(statusItem) {
        try {
            // Find media element (image or video)
            const mediaElement = statusItem.querySelector('img') || statusItem.querySelector('video');
            if (!mediaElement) {
                showNotification('No media found in status');
                return;
            }

            // Get media URL
            const mediaUrl = mediaElement.src;
            if (!mediaUrl) {
                showNotification('Media URL not found');
                return;
            }

            // Create download link
            const a = document.createElement('a');
            
            if (mediaElement.tagName === 'VIDEO') {
                // For videos, fetch the blob
                const response = await fetch(mediaUrl);
                const blob = await response.blob();
                a.href = URL.createObjectURL(blob);
                a.download = `whatsapp-status-${Date.now()}.mp4`;
            } else {
                // For images, use direct URL
                a.href = mediaUrl;
                a.download = `whatsapp-status-${Date.now()}.jpg`;
            }

            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showNotification('Status downloaded successfully!');
        } catch (error) {
            console.error('Error downloading status:', error);
            showNotification('Failed to download status');
        }
    }

    // React to status with emoji
    function reactToStatus(statusItem, emoji) {
        // Find status ID or unique identifier
        const statusId = statusItem.getAttribute('data-id') || Date.now().toString();
        
        // Save reaction in storage
        chrome.storage.local.get('statusReactions', ({ statusReactions = {} }) => {
            statusReactions[statusId] = emoji;
            chrome.storage.local.set({ statusReactions }, () => {
                // Show reaction animation
                showReactionAnimation(statusItem, emoji);
                // Send reaction to background script for potential sync
                chrome.runtime.sendMessage({
                    type: 'STATUS_REACTION',
                    statusId,
                    emoji
                });
            });
        });
    }

    // Show reaction animation
    function showReactionAnimation(statusItem, emoji) {
        const animation = document.createElement('div');
        animation.className = 'status-reaction-animation';
        animation.textContent = emoji;
        
        statusItem.appendChild(animation);
        
        // Remove animation after it completes
        setTimeout(() => {
            if (statusItem.contains(animation)) {
                statusItem.removeChild(animation);
            }
        }, 1000);
    }
    
    // Initialize the extension when WhatsApp Web is fully loaded
    waitForElement('.app-wrapper-web', initExtension);
})();
