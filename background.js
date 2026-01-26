// Daily Code Reminder - Background Service Worker
// Handles alarms and tab opening for daily coding reminders

// ============================================================================
// CONSTANTS
// ============================================================================

const ALARM_NAME = 'dailyCodeReminder';

// SECURITY: Allowlisted URLs for external navigation (A10 - SSRF Prevention)
const ALLOWED_URLS = Object.freeze({
  leetcode: 'https://leetcode.com/problemset/',
  codeforces: 'https://codeforces.com/problemset'
});

// SECURITY: Valid platforms for input validation (A03 - Injection Prevention)
const VALID_PLATFORMS = Object.freeze(['leetcode', 'codeforces']);

// SECURITY: Valid message types for input validation
const VALID_MESSAGE_TYPES = Object.freeze([
  'GET_STATUS',
  'MARK_COMPLETE', 
  'MARK_INCOMPLETE',
  'UPDATE_SETTINGS',
  'TRIGGER_CHECK'
]);

const DEFAULT_SETTINGS = Object.freeze({
  reminderInterval: 30,
  quietHoursStart: 23,
  quietHoursEnd: 7,
  leetcodeEnabled: true,
  codeforcesEnabled: true
});

const DEFAULT_TASKS = Object.freeze({
  leetcode: false,
  codeforces: false,
  lastReset: null
});

const DEFAULT_STATS = Object.freeze({
  leetcodeStreak: 0,
  codeforcesStreak: 0,
  leetcodeTotalDays: 0,
  codeforcesTotalDays: 0,
  history: []
});

// ============================================================================
// SECURITY: INPUT VALIDATION (A03)
// ============================================================================

function isValidPlatform(platform) {
  return typeof platform === 'string' && VALID_PLATFORMS.includes(platform);
}

function isValidMessageType(type) {
  return typeof type === 'string' && VALID_MESSAGE_TYPES.includes(type);
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') return null;
  return {
    reminderInterval: sanitizeNumber(settings.reminderInterval, 15, 120, 30),
    quietHoursStart: sanitizeNumber(settings.quietHoursStart, 0, 23, 23),
    quietHoursEnd: sanitizeNumber(settings.quietHoursEnd, 0, 23, 7),
    leetcodeEnabled: typeof settings.leetcodeEnabled === 'boolean' ? settings.leetcodeEnabled : true,
    codeforcesEnabled: typeof settings.codeforcesEnabled === 'boolean' ? settings.codeforcesEnabled : true
  };
}

function sanitizeNumber(value, min, max, defaultValue) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) return defaultValue;
  return num;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  await initializeStorage();
  await setupAlarm();
  await checkAndResetTasks();
  await checkAndOpenTabs();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('Browser started');
  await checkAndResetTasks();
  await setupAlarm();
  await checkAndOpenTabs();
});

// Immediate initialization when service worker loads
(async function initializeOnLoad() {
  console.log('Service worker loaded');
  await initializeStorage();
  await setupAlarm();
  await checkAndResetTasks();
  setTimeout(async () => {
    console.log('Initial check...');
    await checkAndOpenTabs();
  }, 3000);
})();

async function initializeStorage() {
  const storage = await chrome.storage.local.get(['settings', 'tasks', 'stats']);
  if (!storage.settings) {
    await chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS } });
  }
  if (!storage.tasks) {
    await chrome.storage.local.set({ tasks: { ...DEFAULT_TASKS, lastReset: getTodayDateString() } });
  }
  if (!storage.stats) {
    await chrome.storage.local.set({ stats: { ...DEFAULT_STATS } });
  }
}

// ============================================================================
// ALARM HANDLING
// ============================================================================

async function setupAlarm() {
  const { settings } = await chrome.storage.local.get('settings');
  const interval = sanitizeNumber(settings?.reminderInterval, 15, 120, 30);
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: interval });
  console.log('Alarm configured:', interval, 'min');
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await checkAndResetTasks();
    await checkAndOpenTabs();
  }
});

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

async function checkAndResetTasks() {
  const { tasks, stats } = await chrome.storage.local.get(['tasks', 'stats']);
  const today = getTodayDateString();

  if (tasks?.lastReset !== today) {
    console.log('New day - resetting tasks');
    
    if (tasks?.lastReset) {
      const updatedStats = { ...stats };
      updatedStats.leetcodeStreak = tasks.leetcode === true ? (stats?.leetcodeStreak || 0) + 1 : 0;
      updatedStats.codeforcesStreak = tasks.codeforces === true ? (stats?.codeforcesStreak || 0) + 1 : 0;
      if (tasks.leetcode === true) updatedStats.leetcodeTotalDays = (stats?.leetcodeTotalDays || 0) + 1;
      if (tasks.codeforces === true) updatedStats.codeforcesTotalDays = (stats?.codeforcesTotalDays || 0) + 1;
      updatedStats.history = [...(stats?.history || []), { date: tasks.lastReset, leetcode: tasks.leetcode === true, codeforces: tasks.codeforces === true }].slice(-30);
      await chrome.storage.local.set({ stats: updatedStats });
    }

    await chrome.storage.local.set({ tasks: { leetcode: false, codeforces: false, lastReset: today } });
  }
}

async function markTaskComplete(platform) {
  if (!isValidPlatform(platform)) return { error: 'Invalid platform' };
  const { tasks } = await chrome.storage.local.get('tasks');
  await chrome.storage.local.set({ tasks: { ...tasks, [platform]: true } });
  return { success: true };
}

// ============================================================================
// TAB OPENING (Core functionality)
// ============================================================================

function isQuietHours(settings) {
  const hour = new Date().getHours();
  const start = sanitizeNumber(settings?.quietHoursStart, 0, 23, 23);
  const end = sanitizeNumber(settings?.quietHoursEnd, 0, 23, 7);
  if (start > end) return hour >= start || hour < end;
  return hour >= start && hour < end;
}

async function checkAndOpenTabs() {
  console.log('Checking tasks...');
  const { tasks, settings } = await chrome.storage.local.get(['tasks', 'settings']);
  const effectiveSettings = settings || DEFAULT_SETTINGS;

  if (isQuietHours(effectiveSettings)) {
    console.log('Quiet hours - skipping');
    return;
  }

  if (effectiveSettings.leetcodeEnabled !== false && tasks?.leetcode !== true) {
    console.log('Opening LeetCode');
    chrome.tabs.create({ url: ALLOWED_URLS.leetcode, active: true });
  }

  if (effectiveSettings.codeforcesEnabled !== false && tasks?.codeforces !== true) {
    console.log('Opening Codeforces');
    chrome.tabs.create({ url: ALLOWED_URLS.codeforces, active: true });
  }
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.id || sender.id !== chrome.runtime.id) {
    sendResponse({ error: 'Unauthorized' });
    return false;
  }
  handleMessage(message).then(sendResponse);
  return true;
});

async function handleMessage(message) {
  if (!message || !isValidMessageType(message.type)) {
    return { error: 'Invalid message type' };
  }

  switch (message.type) {
    case 'GET_STATUS':
      return await chrome.storage.local.get(['tasks', 'stats', 'settings']);
    case 'MARK_COMPLETE':
      if (!isValidPlatform(message.platform)) return { error: 'Invalid platform' };
      return await markTaskComplete(message.platform);
    case 'MARK_INCOMPLETE':
      if (!isValidPlatform(message.platform)) return { error: 'Invalid platform' };
      const { tasks } = await chrome.storage.local.get('tasks');
      await chrome.storage.local.set({ tasks: { ...tasks, [message.platform]: false } });
      return { success: true };
    case 'UPDATE_SETTINGS':
      const sanitized = validateSettings(message.settings);
      if (!sanitized) return { error: 'Invalid settings' };
      await chrome.storage.local.set({ settings: sanitized });
      await setupAlarm();
      return { success: true };
    case 'TRIGGER_CHECK':
      await checkAndOpenTabs();
      return { success: true };
    default:
      return { error: 'Unknown message type' };
  }
}
