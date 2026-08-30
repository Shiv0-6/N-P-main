document.addEventListener('DOMContentLoaded', function () {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                  navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    
    const mainContent = document.getElementById('mainContent');
    const errorElement = document.getElementById('error');
    const toastOpacityToggle = document.getElementById('toastOpacityToggle');
    const opacityLevelDisplay = document.getElementById('opacityLevel');
    const uninstallButton = document.getElementById('uninstallButton');
    const apiKeyInput = document.getElementById('apiKey');
    const customEndpointInput = document.getElementById('customEndpoint');
    const modelNameInput = document.getElementById('modelName');
    
    // Custom API Configuration elements
    const useCustomAPIToggle = document.getElementById('useCustomAPI');
    const customAPIForm = document.getElementById('customAPIForm');
    const aiProviderSelect = document.getElementById('aiProvider');
    const customEndpointDiv = document.getElementById('customEndpointDiv');
    const testAPIConfigButton = document.getElementById('testAPIConfig');

    const API_BASE_URL = 'https://api.neopass.tech';
    const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    const CUSTOM_API_STORAGE_KEYS = ['useCustomAPI', 'aiProvider', 'customEndpoint', 'customAPIKey', 'customModelName'];

    // Debounced auto-save function for API configuration
    let saveTimeout;
    function autoSaveAPIConfig() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            // Always get values from settings tab (single source of configuration)
            const apiKey = document.getElementById('apiKey')?.value?.trim();
            const aiProvider = document.getElementById('aiProvider')?.value;
            const customEndpoint = document.getElementById('customEndpoint')?.value?.trim();
            const modelName = document.getElementById('modelName')?.value?.trim();
            const useCustomAPI = document.getElementById('useCustomAPI')?.checked;

            // Check if user is logged in
            const { loggedIn } = await chrome.storage.local.get(['loggedIn']);
            
            // For non-logged-in users, always require custom API
            // For logged-in users, save only if toggle is enabled and API key is provided
            if ((!loggedIn || useCustomAPI) && apiKey) {
                try {
                    await chrome.storage.local.set({
                        useCustomAPI: true,
                        aiProvider: aiProvider,
                        customEndpoint: customEndpoint,
                        customAPIKey: apiKey,
                        customModelName: modelName
                    });
                    console.log('API configuration auto-saved');
                    // Show a subtle success indication
                    showError('API configuration saved', 1500);
                } catch (error) {
                    console.error('Error auto-saving API configuration:', error);
                    showError('Failed to save API configuration', 2000);
                }
            }
        }, 1000); // Save after 1 second of no changes
    }

    // Function to clear chat history when provider changes
    function clearChatHistoryOnProviderChange() {
        try {
            // Send message to all tabs to clear their chat history
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(tab => {
                    try {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'clearChatHistory',
                            reason: 'providerChange'
                        }).catch(() => {
                            // Ignore errors for tabs that can't receive messages
                        });
                    } catch (error) {
                        // Ignore errors
                    }
                });
            });
        } catch (error) {
            console.error('Error clearing chat history:', error);
        }
    }

    // Function to update all shortcuts based on platform
    function updateShortcutsForPlatform() {
        // Define shortcut mappings
        const shortcutMappings = {
            'Option + T': isMac ? 'Option + T' : 'Alt + T',
            'Option + A': isMac ? 'Option + A' : 'Alt + A',
            'Option + K': isMac ? 'Option + K' : 'Alt + K',
            'Option + C': isMac ? 'Option + C' : 'Alt + C',
            'Control + Period [.]': isMac ? 'Control + Period [.]' : 'Ctrl + Period [.]',
            'Control + Comma [,]': isMac ? 'Control + Comma [,]' : 'Ctrl + Comma [,]',
            'Option + Comma [,]': isMac ? 'Option + Comma [,]' : 'Alt + Comma [,]',
            'Option + P': isMac ? 'Option + P' : 'Alt + P'
        };

        // Update all shortcut keys
        document.querySelectorAll('.shortcut-key').forEach(element => {
            const currentText = element.textContent.trim();
            if (shortcutMappings[currentText]) {
                element.textContent = shortcutMappings[currentText];
            }
        });

        // Update the opacity shortcut info text
        const opacityShortcutInfo = document.querySelector('.toggle-info');
        if (opacityShortcutInfo && opacityShortcutInfo.textContent.includes('Shortcut:')) {
            opacityShortcutInfo.textContent = `Shortcut: ${isMac ? 'Option + O' : 'Alt + O'}`;
        }
    }

    // Update chat shortcut display based on platform
    const chatShortcutElement = document.getElementById('chatShortcut');
    if (chatShortcutElement) {
        chatShortcutElement.textContent = isMac ? 'Option+C' : 'Alt+C';
    }

    // Tab Functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active class on buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Function to refresh all tabs - important when changing auth state
    function refreshAllTabs() {
        chrome.tabs.query({}, function(tabs) {
            for (let tab of tabs) {
                chrome.tabs.reload(tab.id);
            }
        });
    }

    // Helper Functions
    function showError(message, duration = 5000) {
        errorElement.innerText = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.innerText = '';
            errorElement.classList.add('hidden');
        }, duration);
    }

    function initializeUI() {
        // *** PRO VERSION UNLOCKED: No login UI needed ***
        // All features are free and enabled by default
        const customAPIInfo = document.getElementById('customAPIInfo');
        if (customAPIInfo) {
            customAPIInfo.textContent = 'Optional: Configure your own AI provider (API keys)';
        }
        
        // Update shortcuts based on platform
        updateShortcutsForPlatform();
    }

    // All login functions removed - no login needed

    // No session expiration checks needed

    // No logout functionality needed

    // Initialize extension on popup open
    // *** PRO VERSION UNLOCKED: All features now free, no login needed ***
    chrome.storage.local.get(['accessToken', 'refreshToken'], function (data) {
        // Ensure pro tokens are always available
        if (!data.accessToken || !data.refreshToken) {
            chrome.storage.local.set({
                loggedIn: true,
                isPro: true,
                username: 'NeoPass Pro User',
                accessToken: 'pro-unlimited-token-free',
                refreshToken: 'pro-unlimited-refresh-free'
            });
        }
        
        // Initialize UI
        initializeUI();
        loadAPIConfiguration();
        initializeOpacityLevel();
    });

    // Error handling for network issues
    window.addEventListener('offline', () => {
        showError('No internet connection. Please check your network.');
    });

    // Initialize toast opacity level from storage
    function initializeOpacityLevel() {
        chrome.storage.local.get(['toastOpacityLevel'], (result) => {
            if (result.toastOpacityLevel) {
                opacityLevelDisplay.textContent = capitalizeFirstLetter(result.toastOpacityLevel);
            } else {
                opacityLevelDisplay.textContent = 'High'; // Default value
            }
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Handle toast opacity toggle button click
    if (toastOpacityToggle) {
        toastOpacityToggle.addEventListener('click', function() {
            chrome.runtime.sendMessage({ action: 'toggleToastOpacity' }, (response) => {
                if (response && response.success) {
                    // Update the displayed level
                    opacityLevelDisplay.textContent = capitalizeFirstLetter(response.level);
                    
                    // Show a temporary success message
                    showError(`Toast opacity set to: ${capitalizeFirstLetter(response.level)}`, 2000);
                }
            });
        });
    }

    // Initialize opacity level on load
    initializeOpacityLevel();
    
    // Load saved API configuration (for Free tab - always accessible)
    function loadAPIConfiguration() {
        chrome.storage.local.get([
            'useCustomAPI',
            'aiProvider',
            'customEndpoint',
            'customAPIKey',
            'customModelName'
        ], (result) => {
            if (result.useCustomAPI) {
                useCustomAPIToggle.checked = true;
                customAPIForm.classList.remove('hidden');
            }
            if (result.aiProvider) {
                document.getElementById('aiProvider').value = result.aiProvider;
                // Show custom endpoint field only if provider is 'custom'
                if (result.aiProvider === 'custom') {
                    customEndpointDiv.classList.remove('hidden');
                } else {
                    // Explicitly hide custom endpoint field for other providers
                    customEndpointDiv.classList.add('hidden');
                }
            } else {
                // If no provider is saved, hide custom endpoint field by default
                customEndpointDiv.classList.add('hidden');
            }
            if (result.customEndpoint && customEndpointInput) {
                customEndpointInput.value = result.customEndpoint;
            }
            if (result.customAPIKey && apiKeyInput) {
                apiKeyInput.value = result.customAPIKey;
            }
            if (result.customModelName && modelNameInput) {
                modelNameInput.value = result.customModelName;
            }
        });
    }



    // Toggle custom API form visibility
    if (useCustomAPIToggle) {
        useCustomAPIToggle.addEventListener('change', async function() {
            if (this.checked) {
                customAPIForm.classList.remove('hidden');
                // Auto-save when toggle is enabled
                autoSaveAPIConfig();
            } else {
                customAPIForm.classList.add('hidden');
                // Explicitly remove custom API configuration when toggle is turned off
                await chrome.storage.local.remove(CUSTOM_API_STORAGE_KEYS);
                if (aiProviderSelect) {
                    aiProviderSelect.selectedIndex = 0;
                }
                if (customEndpointDiv) {
                    customEndpointDiv.classList.add('hidden');
                }
                if (apiKeyInput) {
                    apiKeyInput.value = '';
                }
                if (customEndpointInput) {
                    customEndpointInput.value = '';
                }
                if (modelNameInput) {
                    modelNameInput.value = '';
                }
                
                // Clear chat history when disabling custom API
                clearChatHistoryOnProviderChange();
                
                showError('Custom API disabled. Using default proxy.', 2000);
            }
        });
    }

    // Show/hide custom endpoint field based on provider selection
    if (aiProviderSelect) {
        aiProviderSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customEndpointDiv.classList.remove('hidden');
            } else {
                customEndpointDiv.classList.add('hidden');
            }
            
            // Clear chat history when switching providers
            clearChatHistoryOnProviderChange();
            
            // Auto-save when provider changes
            autoSaveAPIConfig();
        });
    }

    // Add auto-save listeners to API configuration inputs
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', autoSaveAPIConfig);
    }
    if (customEndpointInput) {
        customEndpointInput.addEventListener('input', autoSaveAPIConfig);
    }
    if (modelNameInput) {
        modelNameInput.addEventListener('input', autoSaveAPIConfig);
    }

    // Test API configuration
    if (testAPIConfigButton) {
        testAPIConfigButton.addEventListener('click', async function() {
            const apiKey = document.getElementById('apiKey').value.trim();
            const aiProvider = document.getElementById('aiProvider').value;
            const customEndpoint = document.getElementById('customEndpoint').value.trim();
            const modelName = document.getElementById('modelName').value.trim();

            if (!apiKey) {
                showError('Please enter an API key first', 3000);
                return;
            }

            // Show loading state
            testAPIConfigButton.textContent = 'Testing...';
            testAPIConfigButton.disabled = true;

            try {
                // Send test message to background script
                chrome.runtime.sendMessage({
                    action: 'testCustomAPI',
                    config: {
                        aiProvider: aiProvider,
                        customEndpoint: customEndpoint,
                        apiKey: apiKey,
                        modelName: modelName
                    }
                }, (response) => {
                    testAPIConfigButton.textContent = 'Test Connection';
                    testAPIConfigButton.disabled = false;

                    if (response && response.success) {
                        showError('✓ API connection successful!', 3000);
                    } else {
                        showError('✗ API connection failed: ' + (response?.error || 'Unknown error'), 5000);
                    }
                });
            } catch (error) {
                testAPIConfigButton.textContent = 'Test Connection';
                testAPIConfigButton.disabled = false;
                showError('Error testing API: ' + error.message, 5000);
            }
        });
    }


    
    // Uninstall button event listener
    if (uninstallButton) {
        uninstallButton.addEventListener('click', async () => {
            try {
                // Clear all storage
                await chrome.storage.local.clear();
                
                // Uninstall the extension
                chrome.management.uninstallSelf();
            } catch (error) {
                console.error('Error during uninstall:', error);
                errorElement.textContent = 'Error uninstalling extension';
            }
        });
    }

    // Add event listener for "Go to Settings" link in Pro tab
    const goToSettingsLink = document.getElementById('goToSettingsLink');
    if (goToSettingsLink) {
        goToSettingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Switch to Settings tab
            const settingsTab = document.querySelector('[data-tab="settings-tab"]');
            const proTab = document.querySelector('[data-tab="pro-tab"]');
            
            if (settingsTab && proTab) {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activate Settings tab
                settingsTab.classList.add('active');
                document.getElementById('settings-tab').classList.add('active');
            }
        });
    }

    // Initialize when content is loaded - dropdown functionality removed
    // All shortcuts are now visible by default
});

