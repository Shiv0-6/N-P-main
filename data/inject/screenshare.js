// Mac detection - only declare if not already declared
let isMac;
if (typeof isMac === 'undefined') {
    isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

// Lists of events to intercept
const windowEvents = [
    "blur", 
    "focus", 
    "beforeunload", 
    "pagehide", 
    "unload", 
    "popstate", 
    "resize", 
    "pagehide", 
    'lostpointercapture', 
    "fullscreenchange", 
    "visibilitychange"
];

const documentEvents = [
    "paste", 
    "onpaste", 
    "visibilitychange", 
    "webkitvisibilitychange"
];

// Store original property descriptors for restoration
const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
const originalWebkitVisibilityState = Object.getOwnPropertyDescriptor(document, "webkitVisibilityState");
const originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");

// Event handler to prevent default behavior
const eventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
};

// Main function to bypass browser restrictions
function bypassRestrictions() {
    // Aggressively block beforeunload popup
    const blockBeforeUnload = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        delete e['returnValue'];
    };
    
    // Add our handler with highest priority (capture phase)
    window.addEventListener('beforeunload', blockBeforeUnload, true);
    
    // Override addEventListener to block beforeunload handlers
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'beforeunload') {
            return; // Completely ignore beforeunload listeners
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Override onbeforeunload property setter
    Object.defineProperty(window, 'onbeforeunload', {
        set: function(val) {
            // Silently ignore attempts to set onbeforeunload
        },
        get: function() {
            return null;
        },
        configurable: false
    });
    
    // Prevent window events from firing
    windowEvents.forEach(eventName => {
        // Skip unload and beforeunload events
        if (eventName !== 'unload' && eventName !== 'beforeunload') {
            window.addEventListener(eventName, eventHandler, true);
        }
    });

    // Prevent document events from firing
    documentEvents.forEach(eventName => {
        document.addEventListener(eventName, eventHandler, true);
    });

    // Override visibility state properties
    Object.defineProperty(document, "visibilityState", {
        get: () => "visible",
        configurable: true
    });

    Object.defineProperty(document, 'webkitVisibilityState', {
        get: () => "visible",
        configurable: true
    });

    Object.defineProperty(document, "hidden", {
        get: () => false,
        configurable: true
    });
}

// All features unlocked — no API / auth checks needed

// Function to spoof screen recording behavior
function spoofScreenRecording() {
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    
    // Store original method reference
    if (!navigator.mediaDevices.__originalGetDisplayMedia) {
        navigator.mediaDevices.__originalGetDisplayMedia = originalGetDisplayMedia;
    }
    
    navigator.mediaDevices.getDisplayMedia = async function(constraints) {
        // Will be handled by combined popup
        return new Promise((resolve, reject) => {
            showPopup(resolve, reject, constraints, originalGetDisplayMedia);
        });
    };
}

function showPopup(resolve, reject, constraints, originalGetDisplayMedia) {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });

    const origin = location.origin;

    const styles = document.createElement('style');
    styles.textContent = `
        *, *::before, *::after {
            margin: 0; padding: 0; box-sizing: border-box;
            font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            -webkit-text-fill-color: currentColor;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to   { opacity: 0; }
        }
        .np-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2147483646;
            animation: fadeIn 0.15s ease;
        }
        .np-root {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2147483647;
            animation: fadeIn 0.15s ease;
        }
        .np-dialog {
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.08);
            width: 420px;
            max-width: calc(100vw - 32px);
            overflow: hidden;
        }
        .np-dialog-header {
            padding: 20px 20px 0;
        }
        .np-dialog-title {
            font-size: 15px;
            font-weight: 600;
            color: #202124;
            margin-bottom: 4px;
        }
        .np-dialog-origin {
            font-size: 13px;
            color: #5f6368;
            margin-bottom: 16px;
            word-break: break-all;
        }
        .np-dialog-body {
            padding: 0 20px;
        }
        .np-option-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .np-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.12s;
            border: 1px solid transparent;
        }
        .np-option:hover {
            background: #f1f3f4;
        }
        .np-option.selected {
            background: #e8f0fe;
            border-color: #d2e3fc;
        }
        .np-option-radio {
            width: 16px; height: 16px;
            border-radius: 50%;
            border: 2px solid #80868b;
            position: relative;
            flex-shrink: 0;
            transition: border-color 0.12s;
        }
        .np-option.selected .np-option-radio {
            border-color: #1a73e8;
        }
        .np-option.selected .np-option-radio::after {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #1a73e8;
        }
        .np-option-icon {
            width: 20px; height: 20px;
            flex-shrink: 0;
            fill: #5f6368;
        }
        .np-option-text {
            flex: 1;
        }
        .np-option-label {
            font-size: 13px;
            font-weight: 500;
            color: #202124;
        }
        .np-option-desc {
            font-size: 11px;
            color: #80868b;
            margin-top: 1px;
        }
        .np-dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding: 16px 20px;
            margin-top: 8px;
        }
        .np-dialog-btn {
            padding: 7px 20px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: background 0.12s, box-shadow 0.12s;
            letter-spacing: 0.2px;
        }
        .np-btn-cancel {
            background: #fff;
            color: #1a73e8;
            border: 1px solid #dadce0;
        }
        .np-btn-cancel:hover {
            background: #f6fafe;
            border-color: #d2e3fc;
        }
        .np-btn-share {
            background: #1a73e8;
            color: #fff;
        }
        .np-btn-share:hover {
            background: #1765cc;
            box-shadow: 0 1px 3px rgba(26,115,232,0.3);
        }
        .np-btn-share:disabled {
            background: #dadce0;
            color: #80868b;
            cursor: default;
            box-shadow: none;
        }
        .np-separator {
            height: 1px;
            background: #e8eaed;
            margin: 4px 0;
        }
        .np-hint {
            font-size: 11px;
            color: #80868b;
            padding: 0 20px 4px;
            margin-top: 8px;
        }
    `;
    shadow.appendChild(styles);

    const backdrop = document.createElement('div');
    backdrop.className = 'np-backdrop';
    shadow.appendChild(backdrop);

    const root = document.createElement('div');
    root.className = 'np-root';
    root.innerHTML = `
        <div class="np-dialog">
            <div class="np-dialog-header">
                <div class="np-dialog-title">Choose what to share</div>
                <div class="np-dialog-origin">${origin} wants to share your screen</div>
            </div>
            <div class="np-dialog-body">
                <ul class="np-option-list">
                    <li class="np-option selected" data-mode="tab">
                        <span class="np-option-radio"></span>
                        <svg class="np-option-icon" viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V8h14v10z"/></svg>
                        <div class="np-option-text">
                            <div class="np-option-label">Tab or Window</div>
                            <div class="np-option-desc">Shares only this tab or window, not full screen</div>
                        </div>
                    </li>
                    <li class="np-option" data-mode="blank">
                        <span class="np-option-radio"></span>
                        <svg class="np-option-icon" viewBox="0 0 24 24"><path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14zM9 8l7 4-7 4V8z"/></svg>
                        <div class="np-option-text">
                            <div class="np-option-label">Screen Recording</div>
                            <div class="np-option-desc">Shares a blank screen — nothing is actually captured</div>
                        </div>
                    </li>
                    <div class="np-separator"></div>
                    <li class="np-option" data-mode="freeze">
                        <span class="np-option-radio"></span>
                        <svg class="np-option-icon" viewBox="0 0 24 24"><path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14z"/></svg>
                        <div class="np-option-text">
                            <div class="np-option-label">Entire Screen</div>
                            <div class="np-option-desc">Freezes on a single frame — toggle with Alt+Shift+F</div>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="np-hint">Shared content is visible to the requesting site only</div>
            <div class="np-dialog-footer">
                <button type="button" class="np-dialog-btn np-btn-cancel">Cancel</button>
                <button type="button" class="np-dialog-btn np-btn-share">Share</button>
            </div>
        </div>
    `;
    shadow.appendChild(root);


    const options = root.querySelectorAll('.np-option');
    const cancelBtn = root.querySelector('.np-btn-cancel');
    const shareBtn = root.querySelector('.np-btn-share');
    let selectedMode = 'tab';

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedMode = opt.dataset.mode;
        });
    });

    const cleanup = () => {
        backdrop.style.animation = 'fadeOut 0.15s ease';
        root.style.animation = 'fadeOut 0.15s ease';
        setTimeout(() => host.remove(), 140);
    };

    cancelBtn.onclick = () => {
        cleanup();
        reject(new Error('Screen share cancelled by user'));
    };

    backdrop.onclick = () => {
        cleanup();
        reject(new Error('Screen share cancelled by user'));
    };

    shareBtn.onclick = async () => {
        if (selectedMode === 'tab') return handleTab();
        if (selectedMode === 'blank') return handleBlank();
        if (selectedMode === 'freeze') return handleFreeze();
    };

    const handleTab = async () => {
        cleanup();
        try {
            if (isMac) {
                constraints = {
                    video: {
                        displaySurface: "browser",
                        logicalSurface: true,
                        cursor: "always"
                    },
                    audio: false,
                    selfBrowserSurface: "include",
                    surfaceSwitching: "include",
                    systemAudio: "exclude"
                };
            } else {
                constraints = {
                    selfBrowserSurface: "include",
                    monitorTypeSurfaces: "exclude",
                    video: { displaySurface: "window" }
                };
            }
    
            const stream = await originalGetDisplayMedia.call(navigator.mediaDevices, constraints);
            const videoTrack = stream.getVideoTracks()[0];
            const originalGetSettings = videoTrack.getSettings.bind(videoTrack);
            videoTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                return settings;
            };
            resolve(stream);
        } catch (error) {
            reject(error);
        }
    };

    const handleBlank = () => {
        cleanup();
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const stream = canvas.captureStream(30);
            const videoTrack = stream.getVideoTracks()[0];

            const originalGetSettings = videoTrack.getSettings.bind(videoTrack);
            videoTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                settings.width = 1920;
                settings.height = 1080;
                settings.frameRate = 30;
                return settings;
            };

            Object.defineProperty(videoTrack, 'label', {
                get: () => 'screen:0:0',
                configurable: true
            });

            resolve(stream);
        } catch (error) {
            reject(error);
        }
    };

    const handleFreeze = async () => {
        cleanup();
        const chatElements = [
            document.getElementById('chat-overlay-shadow-host'),
            document.getElementById('chat-button-shadow-host')
        ].filter(Boolean);
        try {
            chatElements.forEach(el => el.style.display = 'none');

            const realConstraints = {
                video: { displaySurface: "monitor" },
                audio: false,
                monitorTypeSurfaces: "include",
                surfaceSwitching: "exclude",
                selfBrowserSurface: "exclude",
                systemAudio: "exclude"
            };

            const realStream = await originalGetDisplayMedia.call(navigator.mediaDevices, realConstraints);
            const realTrack = realStream.getVideoTracks()[0];
            const { width, height } = realTrack.getSettings();

            const canvas = document.createElement('canvas');
            canvas.width = width || 1920;
            canvas.height = height || 1080;
            const ctx = canvas.getContext('2d');

            const video = document.createElement('video');
            video.srcObject = realStream;
            video.muted = true;
            await video.play();

            await new Promise(r => setTimeout(r, 300));

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            chatElements.forEach(el => el.style.display = '');

            let isFrozen = true;
            let animFrameId = null;

            function drawLoop() {
                if (!isFrozen && video.readyState >= video.HAVE_CURRENT_DATA) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
                animFrameId = requestAnimationFrame(drawLoop);
            }
            drawLoop();

            let autoRefreshInterval = null;

            function freezeNow() {
                if (isFrozen) return;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                isFrozen = true;
                updateIndicator();
            }

            function unfreezeNow() {
                if (!isFrozen) return;
                isFrozen = false;
                updateIndicator();
            }

            function toggleFreeze() {
                if (isFrozen) unfreezeNow();
                else freezeNow();
            }

            function setAutoRefresh(seconds) {
                clearAutoRefresh();
                if (seconds <= 0) return;
                autoRefreshInterval = setInterval(() => {
                    if (isFrozen && video.readyState >= video.HAVE_CURRENT_DATA) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        flashIndicator();
                    }
                }, seconds * 1000);
                updateIndicator();
            }

            function clearAutoRefresh() {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
                updateIndicator();
            }

            // --- Floating indicator ---
            const indHost = document.createElement('div');
            indHost.id = 'np-freeze-indicator-host';
            indHost.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
            document.body.appendChild(indHost);
            const indShadow = indHost.attachShadow({ mode: 'closed' });

            const indStyle = document.createElement('style');
            indStyle.textContent = `
                *, *::before, *::after {
                    margin: 0; padding: 0; box-sizing: border-box;
                    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
                    -webkit-text-fill-color: currentColor;
                }
                @keyframes npFlash {
                    0% { box-shadow: 0 0 8px 2px rgba(59,130,246,0.7); }
                    100% { box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
                }
                .np-ind {
                    position: fixed;
                    bottom: 16px;
                    right: 16px;
                    pointer-events: auto;
                    background: rgba(17,24,39,0.92);
                    color: #e5e7eb;
                    border-radius: 10px;
                    padding: 10px 14px;
                    font-size: 12px;
                    line-height: 1.4;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 200px;
                    user-select: none;
                    cursor: grab;
                    transition: opacity 0.2s;
                    opacity: 0.92;
                }
                .np-ind.dragging { cursor: grabbing; opacity: 1; }
                .np-ind:hover { opacity: 1; }
                .np-ind-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .np-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .np-dot.frozen { background: #f59e0b; }
                .np-dot.live { background: #10b981; }
                .np-ind-hint {
                    color: #9ca3af;
                    font-size: 11px;
                }
                .np-ind-btns {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }
                .np-ind-btn {
                    pointer-events: auto;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #e5e7eb;
                    border-radius: 5px;
                    padding: 3px 8px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: background 0.15s;
                    white-space: nowrap;
                }
                .np-ind-btn:hover { background: rgba(255,255,255,0.2); }
                .np-ind-btn.active {
                    background: rgba(59,130,246,0.35);
                    border-color: rgba(59,130,246,0.5);
                }
                .np-flash {
                    animation: npFlash 0.5s ease-out;
                }
                .np-ind-timer {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .np-ind-timer select {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #e5e7eb;
                    border-radius: 4px;
                    padding: 2px 4px;
                    font-size: 11px;
                    cursor: pointer;
                    pointer-events: auto;
                }
                .np-ind-timer select option {
                    background: #1f2937;
                    color: #e5e7eb;
                }
                .np-minimize {
                    position: absolute;
                    top: 4px; right: 8px;
                    background: none; border: none;
                    color: #9ca3af;
                    font-size: 14px;
                    cursor: pointer;
                    pointer-events: auto;
                    padding: 2px 4px;
                    line-height: 1;
                }
                .np-minimize:hover { color: #e5e7eb; }
                .np-ind.minimized {
                    min-width: auto;
                    padding: 6px 10px;
                }
                .np-ind.minimized .np-ind-body { display: none; }
            `;
            indShadow.appendChild(indStyle);

            const indEl = document.createElement('div');
            indEl.className = 'np-ind minimized';
            indEl.innerHTML = `
                <button class="np-minimize" title="Expand">&#43;</button>
                <div class="np-ind-row">
                    <span class="np-dot frozen"></span>
                </div>
                <div class="np-ind-body">
                    <div class="np-ind-hint">Alt+Shift+F to toggle &bull; Click buttons below</div>
                    <div class="np-ind-btns">
                        <button class="np-ind-btn np-toggle-btn">Unfreeze</button>
                        <button class="np-ind-btn np-refresh-btn">Refresh Frame</button>
                    </div>
                    <div class="np-ind-timer">
                        <span class="np-ind-hint">Auto-refresh:</span>
                        <select class="np-timer-select">
                            <option value="0">Off</option>
                            <option value="30">30s</option>
                            <option value="60">1 min</option>
                            <option value="120">2 min</option>
                            <option value="300">5 min</option>
                            <option value="600">10 min</option>
                        </select>
                    </div>
                </div>
            `;
            indShadow.appendChild(indEl);

            const dot = indEl.querySelector('.np-dot');
            const toggleBtn = indEl.querySelector('.np-toggle-btn');
            const refreshBtn = indEl.querySelector('.np-refresh-btn');
            const timerSelect = indEl.querySelector('.np-timer-select');
            const minimizeBtn = indEl.querySelector('.np-minimize');

            function updateIndicator() {
                dot.className = 'np-dot ' + (isFrozen ? 'frozen' : 'live');
                toggleBtn.textContent = isFrozen ? 'Unfreeze' : 'Freeze';
                refreshBtn.style.display = isFrozen ? '' : 'none';
            }

            function flashIndicator() {
                indEl.classList.remove('np-flash');
                void indEl.offsetWidth;
                indEl.classList.add('np-flash');
            }

            toggleBtn.onclick = (e) => { e.stopPropagation(); toggleFreeze(); };
            refreshBtn.onclick = (e) => {
                e.stopPropagation();
                if (isFrozen && video.readyState >= video.HAVE_CURRENT_DATA) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    flashIndicator();
                }
            };
            timerSelect.onchange = () => {
                const val = parseInt(timerSelect.value, 10);
                if (val > 0) setAutoRefresh(val);
                else clearAutoRefresh();
            };

            let minimized = true;
            minimizeBtn.onclick = (e) => {
                e.stopPropagation();
                minimized = !minimized;
                indEl.classList.toggle('minimized', minimized);
                minimizeBtn.innerHTML = minimized ? '&#43;' : '&#8211;';
                minimizeBtn.title = minimized ? 'Expand' : 'Minimize';
            };

            // --- Drag to move ---
            let isDragging = false;
            let dragOffsetX = 0, dragOffsetY = 0;
            let hasDragged = false;

            indEl.addEventListener('mousedown', (e) => {
                if (e.target.closest('button, select')) return;
                isDragging = true;
                hasDragged = false;
                indEl.classList.add('dragging');
                const rect = indEl.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                indEl.style.bottom = 'auto';
                indEl.style.right = 'auto';
                indEl.style.left = rect.left + 'px';
                indEl.style.top = rect.top + 'px';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                hasDragged = true;
                let x = e.clientX - dragOffsetX;
                let y = e.clientY - dragOffsetY;
                x = Math.max(0, Math.min(x, window.innerWidth - indEl.offsetWidth));
                y = Math.max(0, Math.min(y, window.innerHeight - indEl.offsetHeight));
                indEl.style.left = x + 'px';
                indEl.style.top = y + 'px';
            });

            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging = false;
                indEl.classList.remove('dragging');
            });

            updateIndicator();

            // Alt+F keyboard shortcut to toggle freeze/unfreeze
            document.addEventListener('keydown', (e) => {
                if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyF') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFreeze();
                    flashIndicator();
                }
            }, true);

            // Clean up when the track ends (proctoring stopped)
            realTrack.addEventListener('ended', () => {
                if (animFrameId) cancelAnimationFrame(animFrameId);
                clearAutoRefresh();
                video.srcObject = null;
                indHost.remove();
            });

            const frozenStream = canvas.captureStream(30);
            const frozenTrack = frozenStream.getVideoTracks()[0];

            const originalGetSettings = frozenTrack.getSettings.bind(frozenTrack);
            frozenTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                settings.width = canvas.width;
                settings.height = canvas.height;
                settings.frameRate = 30;
                return settings;
            };

            Object.defineProperty(frozenTrack, 'label', {
                get: () => 'screen:0:0',
                configurable: true
            });

            // When the spoofed frozen track is stopped, also stop the real stream
            const origStop = frozenTrack.stop.bind(frozenTrack);
            frozenTrack.stop = function() {
                if (animFrameId) cancelAnimationFrame(animFrameId);
                clearAutoRefresh();
                realStream.getTracks().forEach(t => t.stop());
                video.srcObject = null;
                indHost.remove();
                origStop();
            };

            resolve(frozenStream);
        } catch (error) {
            chatElements.forEach(el => el.style.display = '');
            reject(error);
        }
    };
}

// Initialize bypasses and observer
bypassRestrictions();
spoofScreenRecording();