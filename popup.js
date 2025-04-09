// Popup functionality for WhatsApp Web Enhancer
document.addEventListener('DOMContentLoaded', () => {
    // Load saved states
    chrome.storage.sync.get([
        'antiDelete',
        'invisibleMode',
        'aiIntegration',
        'statusFeatures'
    ], (result) => {
        document.getElementById('antiDelete').checked = result.antiDelete || false;
        document.getElementById('invisibleMode').checked = result.invisibleMode || false;
        document.getElementById('aiIntegration').checked = result.aiIntegration || false;
        document.getElementById('statusFeatures').checked = result.statusFeatures || false;
    });

    // Add event listeners for toggles
    const toggles = ['antiDelete', 'invisibleMode', 'aiIntegration', 'statusFeatures'];
    toggles.forEach(feature => {
        document.getElementById(feature).addEventListener('change', (e) => {
            const update = {};
            update[feature] = e.target.checked;
            
            // Save to storage
            chrome.storage.sync.set(update, () => {
                updateStatus(`${feature} ${e.target.checked ? 'enabled' : 'disabled'}`);
            });
            
            // Send message to content script
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.url?.includes('web.whatsapp.com')) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'TOGGLE_FEATURE',
                        feature: feature,
                        enabled: e.target.checked
                    });
                }
            });
        });
    });

    // View deleted messages button
    document.getElementById('viewDeleted').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.includes('web.whatsapp.com')) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'VIEW_DELETED_MESSAGES' });
                updateStatus('Opening deleted messages...');
            } else {
                updateStatus('Please open WhatsApp Web first');
            }
        });
    });

    // Settings button
    document.getElementById('settings').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.includes('web.whatsapp.com')) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_ADVANCED_SETTINGS' });
                updateStatus('Opening settings...');
            } else {
                updateStatus('Please open WhatsApp Web first');
            }
        });
    });

    // Helper function to update status text
    function updateStatus(message) {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = message;
            setTimeout(() => {
                statusElement.textContent = 'Ready';
            }, 2000);
        }
    }
});
