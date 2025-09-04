// Digital Wellbeing Timer - Background Service Worker
// Manages timer tracking, notifications, alarms, and data persistence across browser sessions

let settings = {
    globalTimeLimit: 8, // hours
    breakReminder: 30   // minutes
};

let siteTimers = {};
let currentSession = {
    currentSite: null,
    startTime: null,
    totalTimeToday: 0,
    sitesVisited: new Set(),
    breaksTaken: 0
};

let isTimerPaused = false;

// Initialize extension when service worker starts
chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);

// Initialize extension data and start tracking
function initializeExtension() {
    loadSettings();
    loadSiteTimers();
    startTabTracking();
    setupAlarms();
}

// Load user settings from Chrome storage
function loadSettings() {
    chrome.storage.sync.get(['globalTimeLimit', 'breakReminder'], function(result) {
        settings = {
            globalTimeLimit: result.globalTimeLimit || 8,
            breakReminder: result.breakReminder || 30
        };
    });
}

// Load site timers from local storage
function loadSiteTimers() {
    chrome.storage.local.get(['siteTimers'], function(result) {
        siteTimers = result.siteTimers || {};
    });
}

// Start tracking active tabs for timer functionality
function startTabTracking() {
    chrome.tabs.onActivated.addListener(function(activeInfo) {
        chrome.tabs.get(activeInfo.tabId, function(tab) {
            if (tab.url && tab.url.startsWith('http')) {
                const domain = extractDomain(tab.url);
                startTimerForSite(domain);
            }
        });
    });

    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
            const domain = extractDomain(tab.url);
            startTimerForSite(domain);
        }
    });
}

// Start timer tracking for a specific website domain
function startTimerForSite(domain) {
    const now = Date.now();

    // Stop previous timer if different site
    if (currentSession.currentSite && currentSession.currentSite !== domain && currentSession.startTime) {
        const timeSpent = Math.floor((now - currentSession.startTime) / 1000);
        updateSiteTime(currentSession.currentSite, timeSpent);
    }

    // Start new timer
    currentSession.currentSite = domain;
    currentSession.startTime = now;
    currentSession.sitesVisited.add(domain);

    // Check if site has time limit
    if (siteTimers[domain] && siteTimers[domain].timeLimit) {
        const timeSpent = siteTimers[domain].timeSpent || 0;
        const timeLimit = siteTimers[domain].timeLimit * 60; // Convert to seconds

        if (timeSpent >= timeLimit) {
            showTimeLimitNotification(domain);
        } else if (timeSpent >= timeLimit * 0.8) {
            // Show warning at 80%
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Time Limit Warning',
                message: `You've used 80% of your time limit for ${domain}`
            });
        }
    }

    // Check global time limit
    if (currentSession.totalTimeToday >= settings.globalTimeLimit * 3600) {
        showGlobalTimeLimitNotification();
    }
}

// Update time spent on a specific site
function updateSiteTime(domain, timeSpent) {
    if (!siteTimers[domain]) {
        siteTimers[domain] = { timeSpent: 0, timeLimit: null };
    }

    siteTimers[domain].timeSpent += timeSpent;
    currentSession.totalTimeToday += timeSpent;

    // Save to storage
    chrome.storage.local.set({ siteTimers });

    // Notify content script
    notifyContentScript(domain);
}

// Extract domain from URL for timer tracking
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (e) {
        return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
}

// Show notification when site time limit is reached
function showTimeLimitNotification(domain) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Time Limit Reached',
        message: `You've reached your time limit for ${domain}. Time to take a break!`
    });
}

// Show notification when global time limit is reached
function showGlobalTimeLimitNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Daily Limit Reached',
        message: `You've reached your daily screen time limit of ${settings.globalTimeLimit} hours.`
    });
}

// Set up alarms for break reminders and daily reset
function setupAlarms() {
    // Clear existing alarms
    chrome.alarms.clearAll();

    // Create break reminder alarm
    chrome.alarms.create('breakReminder', {
        delayInMinutes: settings.breakReminder,
        periodInMinutes: settings.breakReminder
    });
}

// Show break reminder notification
function showBreakReminder() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Break Time!',
        message: 'Take a short break to rest your eyes and stretch.'
    });
    currentSession.breaksTaken++;
}

// Notify content script of timer updates
function notifyContentScript(domain) {
    chrome.tabs.query({ url: `*://${domain}/*` }, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'updateTimer',
                siteData: siteTimers[domain]
            });
        });
    });
}

// Handle messages from settings page
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.action) {
        case 'updateSettings':
            settings = request.settings;
            chrome.storage.sync.set(settings);
            setupAlarms();
            break;

        case 'updateSiteTimers':
            siteTimers = request.siteTimers;
            chrome.storage.local.set({ siteTimers });

            // Notify content scripts of updated timers
            Object.keys(siteTimers).forEach(domain => {
                notifyContentScript(domain);
            });
            break;

        case 'toggleTimerPause':
            isTimerPaused = request.isPaused;
            if (isTimerPaused) {
                // Save current session time
                if (currentSession.currentSite && currentSession.startTime) {
                    const timeSpent = Math.floor((Date.now() - currentSession.startTime) / 1000);
                    updateSiteTime(currentSession.currentSite, timeSpent);
                    currentSession.startTime = null;
                }
            } else {
                // Resume timer
                if (currentSession.currentSite) {
                    currentSession.startTime = Date.now();
                }
            }
            break;

        case 'resetCurrentTimer':
            if (currentSession.currentSite) {
                siteTimers[currentSession.currentSite].timeSpent = 0;
                chrome.storage.local.set({ siteTimers });
                notifyContentScript(currentSession.currentSite);
            }
            break;

        case 'getCurrentSiteData':
            const domain = request.domain;
            const siteData = siteTimers[domain] || { timeSpent: 0, timeLimit: null };
            sendResponse({ siteData });
            break;

        case 'getStatistics':
            const statistics = {
                totalTimeToday: currentSession.totalTimeToday,
                sitesVisited: currentSession.sitesVisited.size,
                breaksTaken: currentSession.breaksTaken
            };
            sendResponse({ statistics });
            break;
    }
});

// Save session data periodically to prevent data loss
setInterval(function() {
    if (currentSession.currentSite && currentSession.startTime && !isTimerPaused) {
        const timeSpent = Math.floor((Date.now() - currentSession.startTime) / 1000);
        updateSiteTime(currentSession.currentSite, timeSpent);
        currentSession.startTime = Date.now();
    }
}, 30000); // Save every 30 seconds

// Reset daily statistics at midnight
chrome.alarms.create('dailyReset', {
    when: getNextMidnight()
});

// Handle alarm events for break reminders and daily reset
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'breakReminder') {
        showBreakReminder();
    } else if (alarm.name === 'dailyReset') {
        resetDailyStatistics();
        chrome.alarms.create('dailyReset', {
            when: getNextMidnight()
        });
    }
});

// Calculate next midnight timestamp for daily reset
function getNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
}

// Reset daily statistics at midnight
function resetDailyStatistics() {
    currentSession.totalTimeToday = 0;
    currentSession.sitesVisited.clear();
    currentSession.breaksTaken = 0;

    // Reset all site timers
    Object.keys(siteTimers).forEach(site => {
        if (siteTimers[site]) {
            siteTimers[site].timeSpent = 0;
        }
    });

    chrome.storage.local.set({ siteTimers });
}
