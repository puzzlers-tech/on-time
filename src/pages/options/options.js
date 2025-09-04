// Digital Wellbeing Timer - Full Page Settings Interface
// Provides comprehensive user interface for managing timer settings, viewing statistics, and controlling timer functionality

let currentSettings = {};
let siteTimers = {};
let isTimerPaused = false;

// Initialize settings page when DOM content is loaded
document.addEventListener('DOMContentLoaded', function () {
  initializeSettings();
  setupEventListeners();
  startTimeUpdate();
});

// Initialize settings page data and user interface elements
function initializeSettings() {
  loadSettings();
  loadSiteTimers();
  updateCurrentTime();
  updateCurrentSiteInfo();
  updateStatistics();
}

// Set up event listeners for all interactive elements and keyboard shortcuts
function setupEventListeners() {
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('pauseTimer').addEventListener('click', toggleTimerPause);
  document.getElementById('resetTimer').addEventListener('click', resetCurrentTimer);
  document.getElementById('addSiteTimer').addEventListener('click', addSiteTimer);

  // Add enter key support for quick site timer addition
  document.getElementById('newSiteUrl').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addSiteTimer();
    }
  });

  document.getElementById('newSiteLimit').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addSiteTimer();
    }
  });
}

// Load user settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(['globalTimeLimit', 'breakReminder'], function (result) {
    currentSettings = {
      globalTimeLimit: result.globalTimeLimit || 8,
      breakReminder: result.breakReminder || 30,
    };
    document.getElementById('globalTimeLimit').value = currentSettings.globalTimeLimit;
    document.getElementById('breakReminder').value = currentSettings.breakReminder;
  });
}

// Save settings to Chrome storage and notify background script
function saveSettings() {
  const globalTimeLimit = parseFloat(document.getElementById('globalTimeLimit').value);
  const breakReminder = parseInt(document.getElementById('breakReminder').value);

  currentSettings = { globalTimeLimit, breakReminder };

  chrome.storage.sync.set(currentSettings, function () {
    showNotification('Settings saved successfully!');
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings,
    });
  });
}

// Load site timers from local storage
function loadSiteTimers() {
  chrome.storage.local.get(['siteTimers'], function (result) {
    siteTimers = result.siteTimers || {};
    updateSitesList();
  });
}

// Update the sites list display with current site timers
function updateSitesList() {
  const sitesList = document.getElementById('sitesList');
  sitesList.innerHTML = '';

  if (Object.keys(siteTimers).length === 0) {
    sitesList.innerHTML =
      '<div class="ontime-ext-no-sites">No site timers configured yet. Add your first timer above!</div>';
    return;
  }

  Object.keys(siteTimers).forEach((site) => {
    const siteData = siteTimers[site];
    const siteItem = createSiteItem(site, siteData);
    sitesList.appendChild(siteItem);
  });
}

// Create a site item element for the list
function createSiteItem(site, siteData) {
  const siteItem = document.createElement('div');
  siteItem.className = 'ontime-ext-site-item';

  const timeSpent = formatTime(siteData.timeSpent || 0);
  const timeLimit = siteData.timeLimit ? formatTime(siteData.timeLimit * 60) : '∞';

  siteItem.innerHTML = `
        <div class="ontime-ext-site-item-info">
            <div class="ontime-ext-site-item-name">${site}</div>
            <div class="ontime-ext-site-item-time">${timeSpent} / ${timeLimit}</div>
        </div>
        <div class="ontime-ext-site-item-actions">
            <button class="ontime-ext-btn-remove" data-site="${site}">Remove</button>
        </div>
    `;

  siteItem.querySelector('.ontime-ext-btn-remove').addEventListener('click', function () {
    removeSiteTimer(this.dataset.site);
  });

  return siteItem;
}

// Add a new site timer with validation
function addSiteTimer() {
  const urlInput = document.getElementById('newSiteUrl');
  const limitInput = document.getElementById('newSiteLimit');

  const url = urlInput.value.trim();
  const limit = parseInt(limitInput.value);

  if (!url || !limit) {
    showNotification('Please enter both URL and time limit', 'error');
    return;
  }

  if (limit < 1 || limit > 1440) {
    showNotification('Time limit must be between 1 and 1440 minutes', 'error');
    return;
  }

  const domain = extractDomain(url);

  if (siteTimers[domain]) {
    showNotification('Timer for this site already exists', 'error');
    return;
  }

  siteTimers[domain] = {
    timeLimit: limit,
    timeSpent: 0,
    addedDate: new Date().toISOString(),
  };

  chrome.storage.local.set({ siteTimers }, function () {
    updateSitesList();
    urlInput.value = '';
    limitInput.value = '';
    showNotification('Site timer added successfully!');

    chrome.runtime.sendMessage({
      action: 'updateSiteTimers',
      siteTimers: siteTimers,
    });
  });
}

// Remove a site timer from the list
function removeSiteTimer(site) {
  delete siteTimers[site];

  chrome.storage.local.set({ siteTimers }, function () {
    updateSitesList();
    showNotification('Site timer removed');

    chrome.runtime.sendMessage({
      action: 'updateSiteTimers',
      siteTimers: siteTimers,
    });
  });
}

// Toggle the pause state of the current timer
function toggleTimerPause() {
  isTimerPaused = !isTimerPaused;
  const pauseButton = document.getElementById('pauseTimer');

  if (isTimerPaused) {
    pauseButton.textContent = 'Resume Timer';
    pauseButton.classList.add('ontime-ext-btn-secondary');
    pauseButton.classList.remove('ontime-ext-btn-primary');
  } else {
    pauseButton.textContent = 'Pause Timer';
    pauseButton.classList.add('ontime-ext-btn-primary');
    pauseButton.classList.remove('ontime-ext-btn-secondary');
  }

  chrome.runtime.sendMessage({
    action: 'toggleTimerPause',
    isPaused: isTimerPaused,
  });

  showNotification(isTimerPaused ? 'Timer paused' : 'Timer resumed');
}

// Reset the current site timer
function resetCurrentTimer() {
  chrome.runtime.sendMessage(
    {
      action: 'resetCurrentTimer',
    },
    function () {
      updateCurrentSiteInfo();
      showNotification('Timer reset successfully');
    }
  );
}

// Update the current time display
function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById('currentTime').textContent = timeString;
}

// Start the time update interval
function startTimeUpdate() {
  setInterval(updateCurrentTime, 1000);
}

// Update current site information and timer display
function updateCurrentSiteInfo() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      const domain = extractDomain(currentUrl);

      document.getElementById('currentSiteName').textContent = domain;

      chrome.runtime.sendMessage(
        {
          action: 'getCurrentSiteData',
          domain: domain,
        },
        function (response) {
          if (response && response.siteData) {
            updateTimerDisplay(response.siteData);
          }
        }
      );
    }
  });
}

// Update the timer display with current site data
function updateTimerDisplay(siteData) {
  const timeSpent = siteData.timeSpent || 0;
  const timeLimit = siteData.timeLimit || null;

  document.getElementById('timeSpent').textContent = formatTime(timeSpent);

  if (timeLimit) {
    document.getElementById('timeLimit').textContent = ` / ${formatTime(timeLimit * 60)}`;

    const progress = Math.min((timeSpent / (timeLimit * 60)) * 100, 100);
    document.getElementById('progressFill').style.width = `${progress}%`;

    const progressFill = document.getElementById('progressFill');
    if (progress >= 80) {
      progressFill.style.background = 'linear-gradient(90deg, #f56565, #e53e3e)';
    } else if (progress >= 60) {
      progressFill.style.background = 'linear-gradient(90deg, #ed8936, #dd6b20)';
    } else {
      progressFill.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
    }
  } else {
    document.getElementById('timeLimit').textContent = ' / ∞';
    document.getElementById('progressFill').style.width = '0%';
  }
}

// Update statistics display with current data
function updateStatistics() {
  chrome.runtime.sendMessage(
    {
      action: 'getStatistics',
    },
    function (response) {
      if (response && response.statistics) {
        const stats = response.statistics;
        document.getElementById('totalTimeToday').textContent = formatTime(
          stats.totalTimeToday || 0
        );
        document.getElementById('sitesVisited').textContent = stats.sitesVisited || 0;
        document.getElementById('breaksTaken').textContent = stats.breaksTaken || 0;
      }
    }
  );
}

// Format seconds into MM:SS display format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Extract domain from URL for timer tracking
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }
}

// Show notification with modern styling
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `ontime-ext-notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  // Remove notification after delay
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'updateTimer') {
    updateCurrentSiteInfo();
    updateStatistics();
  }
});

// Update display every second when timer is not paused
setInterval(function () {
  if (!isTimerPaused) {
    updateCurrentSiteInfo();
  }
}, 1000);

// Add CSS for no sites message
const style = document.createElement('style');
style.textContent = `
    .ontime-ext-no-sites {
        text-align: center;
        padding: 20px;
        color: #666;
        font-style: italic;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #dee2e6;
    }
`;
document.head.appendChild(style);
