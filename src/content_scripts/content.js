// Digital Wellbeing Timer - Content Script
// Provides page-level interactions, overlays, and visual feedback for timer functionality

console.log('Digital Wellbeing Timer content.js loaded and running!');

let currentSiteData = {
  timeSpent: 0,
  timeLimit: null,
};

let overlay = null;
let isOverlayVisible = false;
let fabElement = null;
let fabUpdateInterval = null;

// Initialize content script when page loads
document.addEventListener('DOMContentLoaded', function () {
  initializeContentScript();
});

// Initialize content script functionality
function initializeContentScript() {
  createTimerOverlay();
  setupKeyboardShortcuts();
  requestSiteData();
  setupPeriodicDataUpdate();
}

// Create the timer overlay for visual feedback
function createTimerOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'digital-wellbeing-overlay';
  overlay.classList.add('ontime-ext-digital-wellbeing-overlay');
  overlay.innerHTML = `
        <div class="ontime-ext-overlay-content">
            <div class="ontime-ext-overlay-header">
                <h2>Time Limit Reached</h2>
                <button class="ontime-ext-close-btn" id="closeOverlay">×</button>
            </div>
            <div class="ontime-ext-overlay-body">
                <p>You've reached your time limit for this site.</p>
                <p>Consider taking a break to maintain digital wellbeing.</p>
                <div class="ontime-ext-overlay-actions">
                    <button class="ontime-ext-btn-primary" id="takeBreak">Take a Break</button>
                    <button class="ontime-ext-btn-secondary" id="continue5min">Continue 5 More Minutes</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(overlay);

  // Set up overlay event listeners
  document.getElementById('closeOverlay').addEventListener('click', hideOverlay);
  document.getElementById('takeBreak').addEventListener('click', takeBreak);
  document.getElementById('continue5min').addEventListener('click', continue5Minutes);
}

// Set up keyboard shortcuts for quick access
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + Shift + B for break suggestion
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
      e.preventDefault();
      showBreakSuggestion();
    }

    // Escape key to close overlay
    if (e.key === 'Escape' && isOverlayVisible) {
      hideOverlay();
    }
  });
}

// Request current site data from background script
function requestSiteData() {
  const domain = extractDomain(window.location.href);
  chrome.runtime.sendMessage(
    {
      action: 'getCurrentSiteData',
      domain: domain,
    },
    function (response) {
      if (response && response.siteData) {
        updateSiteData(response.siteData);
      }
    }
  );
}

// Update site data and check for time limit violations
function updateSiteData(siteData) {
  currentSiteData = siteData;

  // Check if time limit is reached
  if (siteData.timeLimit && siteData.timeSpent >= siteData.timeLimit * 60) {
    showOverlay();
  }

  // Show warning at 80% of time limit
  if (siteData.timeLimit && siteData.timeSpent >= siteData.timeLimit * 60 * 0.8) {
    showTimeWarning();
  }

  // Update or create FAB if site has a time limit
  if (siteData.timeLimit) {
    if (!fabElement) {
      createFAB();
    }
    updateFAB();
  }
}

// Show the time limit overlay
function showOverlay() {
  if (!isOverlayVisible) {
    overlay.style.display = 'flex';
    isOverlayVisible = true;

    // Add body scroll lock
    document.body.style.overflow = 'hidden';
  }
}

// Hide the time limit overlay
function hideOverlay() {
  if (isOverlayVisible) {
    overlay.style.display = 'none';
    isOverlayVisible = false;

    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// Handle taking a break action
function takeBreak() {
  hideOverlay();

  // Show break suggestion with activities
  showBreakSuggestion();

  // Notify background script
  chrome.runtime.sendMessage({
    action: 'breakTaken',
  });
}

// Handle continuing for 5 more minutes
function continue5Minutes() {
  hideOverlay();

  // Show temporary message
  showTemporaryMessage('You can continue for 5 more minutes. Remember to take breaks!');

  // Set timeout to show overlay again
  setTimeout(() => {
    if (currentSiteData.timeLimit && currentSiteData.timeSpent >= currentSiteData.timeLimit * 60) {
      showOverlay();
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Show break suggestion with activity ideas
function showBreakSuggestion() {
  const activities = [
    'Take a short walk',
    'Do some stretching exercises',
    'Look at something 20 feet away for 20 seconds',
    'Get a glass of water',
    'Practice deep breathing',
    'Stand up and move around',
  ];

  const randomActivity = activities[Math.floor(Math.random() * activities.length)];

  const suggestion = document.createElement('div');
  suggestion.className = 'ontime-ext-break-suggestion';
  suggestion.innerHTML = `
        <div class="ontime-ext-suggestion-content">
            <h3>Break Time!</h3>
            <p>Suggested activity: <strong>${randomActivity}</strong></p>
            <button class="ontime-ext-btn-primary" onclick="this.parentElement.parentElement.remove()">Got it!</button>
        </div>
    `;

  document.body.appendChild(suggestion);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(suggestion)) {
      suggestion.remove();
    }
  }, 10000);
}

// Show time warning at 80% of limit
function showTimeWarning() {
  const warning = document.createElement('div');
  warning.className = 'ontime-ext-time-warning';
  warning.innerHTML = `
        <div class="ontime-ext-warning-content">
            <span>⚠️ You've used 80% of your time limit for this site</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

  document.body.appendChild(warning);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(warning)) {
      warning.remove();
    }
  }, 5000);
}

// Show temporary message to user
function showTemporaryMessage(message) {
  const messageEl = document.createElement('div');
  messageEl.className = 'ontime-ext-temp-message';
  messageEl.textContent = message;

  document.body.appendChild(messageEl);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(messageEl)) {
      messageEl.remove();
    }
  }, 3000);
}

// Extract domain from current URL
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

// Create floating action button (FAB) with countdown
function createFAB() {
  // If FAB already exists, don't create another one
  if (fabElement) return;

  // Create the FAB element
  fabElement = document.createElement('div');
  fabElement.id = 'wellbeing-fab';
  fabElement.classList.add('ontime-ext-wellbeing-fab');
  fabElement.innerHTML = `
        <div class="ontime-ext-fab-content">
            <div class="ontime-ext-fab-icon">⏰</div>
            <div class="ontime-ext-fab-countdown" id="fab-countdown">--:--</div>
        </div>
        <button class="ontime-ext-fab-dismiss" id="fab-dismiss">×</button>
    `;

  document.body.appendChild(fabElement);

  // Add event listener to dismiss button
  document.getElementById('fab-dismiss').addEventListener('click', dismissFAB);

  // Start update interval
  if (!fabUpdateInterval) {
    fabUpdateInterval = setInterval(updateFAB, 1000);
  }

  // Initial update
  updateFAB();
}

// Update FAB countdown display
function updateFAB() {
  if (!fabElement || !currentSiteData || !currentSiteData.timeLimit) return;

  const timeLimit = currentSiteData.timeLimit * 60; // Convert to seconds
  const timeSpent = currentSiteData.timeSpent || 0;
  const remainingTime = Math.max(0, timeLimit - timeSpent);

  const countdownElement = document.getElementById('fab-countdown');
  if (countdownElement) {
    countdownElement.textContent = formatTime(remainingTime);

    // Update color based on remaining time percentage
    const progress = (timeSpent / timeLimit) * 100;
    if (progress >= 80) {
      fabElement.className = 'ontime-ext-fab-warning';
    } else if (progress >= 60) {
      fabElement.className = 'ontime-ext-fab-caution';
    } else {
      fabElement.className = 'ontime-ext-fab-normal';
    }
  }
}

// Dismiss the FAB
function dismissFAB() {
  if (fabElement) {
    document.body.removeChild(fabElement);
    fabElement = null;

    if (fabUpdateInterval) {
      clearInterval(fabUpdateInterval);
      fabUpdateInterval = null;
    }
  }
}

// Set up periodic data update
function setupPeriodicDataUpdate() {
  // Update site data every second
  setInterval(function () {
    if (fabElement) {
      const domain = extractDomain(window.location.href);
      chrome.runtime.sendMessage(
        {
          action: 'getCurrentSiteData',
          domain: domain,
        },
        function (response) {
          if (response && response.siteData) {
            currentSiteData = response.siteData;
            updateFAB();
          }
        }
      );
    }
  }, 1000);
}

// Format time as MM:SS
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'updateTimer') {
    updateSiteData(request.siteData);
  }
});
