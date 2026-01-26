// Daily Code Reminder - Popup
// Simple, clean UI for marking daily tasks complete

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadStatus();
  setupListeners();
}

async function loadStatus() {
  try {
    const { tasks, stats } = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    if (stats) updateStreaks(stats);
    if (tasks) updateTasks(tasks);
  } catch (e) {
    console.error('Load failed:', e);
  }
}

function updateStreaks(stats) {
  const lc = document.getElementById('leetcodeStreak');
  const cf = document.getElementById('codeforcesStreak');
  lc.textContent = stats.leetcodeStreak >= 7 ? `${stats.leetcodeStreak} 🔥` : stats.leetcodeStreak || 0;
  cf.textContent = stats.codeforcesStreak >= 7 ? `${stats.codeforcesStreak} 🔥` : stats.codeforcesStreak || 0;
}

function updateTasks(tasks) {
  setTaskState('leetcode', tasks.leetcode);
  setTaskState('codeforces', tasks.codeforces);
}

function setTaskState(platform, done) {
  const card = document.getElementById(`${platform}Card`);
  const check = document.getElementById(`${platform}Check`);
  const status = document.getElementById(`${platform}Status`);
  
  check.checked = done;
  card.classList.toggle('completed', done);
  status.textContent = done ? 'Completed! ✓' : 'Not completed';
}

function setupListeners() {
  document.getElementById('leetcodeCheck').addEventListener('change', e => toggle('leetcode', e.target.checked));
  document.getElementById('codeforcesCheck').addEventListener('change', e => toggle('codeforces', e.target.checked));
  document.getElementById('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
}

async function toggle(platform, done) {
  setTaskState(platform, done);
  try {
    await chrome.runtime.sendMessage({ type: done ? 'MARK_COMPLETE' : 'MARK_INCOMPLETE', platform });
    if (done) celebrate(platform);
  } catch (e) {
    setTaskState(platform, !done);
  }
}

function celebrate(platform) {
  const card = document.getElementById(`${platform}Card`);
  card.style.transform = 'scale(1.02)';
  card.style.boxShadow = '0 0 30px rgba(82, 196, 26, 0.5)';
  setTimeout(() => { card.style.transform = ''; card.style.boxShadow = ''; }, 500);
}
