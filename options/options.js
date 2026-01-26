// Daily Code Reminder - Options
// Settings page for configuring reminders

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  setupListeners();
}

async function loadSettings() {
  try {
    const { settings } = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    if (settings) {
      document.getElementById('leetcodeEnabled').checked = settings.leetcodeEnabled ?? true;
      document.getElementById('codeforcesEnabled').checked = settings.codeforcesEnabled ?? true;
      document.getElementById('reminderInterval').value = settings.reminderInterval ?? 30;
      document.getElementById('quietHoursStart').value = settings.quietHoursStart ?? 23;
      document.getElementById('quietHoursEnd').value = settings.quietHoursEnd ?? 7;
    }
  } catch (e) {
    console.error('Load failed:', e);
  }
}

function setupListeners() {
  ['leetcodeEnabled', 'codeforcesEnabled', 'reminderInterval', 'quietHoursStart', 'quietHoursEnd']
    .forEach(id => document.getElementById(id).addEventListener('change', saveSettings));
}

async function saveSettings() {
  const settings = {
    leetcodeEnabled: document.getElementById('leetcodeEnabled').checked,
    codeforcesEnabled: document.getElementById('codeforcesEnabled').checked,
    reminderInterval: parseInt(document.getElementById('reminderInterval').value, 10),
    quietHoursStart: parseInt(document.getElementById('quietHoursStart').value, 10),
    quietHoursEnd: parseInt(document.getElementById('quietHoursEnd').value, 10)
  };
  
  try {
    await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings });
    showSaved();
  } catch (e) {
    console.error('Save failed:', e);
  }
}

function showSaved() {
  const el = document.getElementById('saveStatus');
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2000);
}
