// popup.js

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const fillBtn = document.getElementById('fillBtn');
const profileCheck = document.getElementById('profileCheck');

function setStatus(state, message) {
  statusDot.className = 'status-dot ' + state;
  statusText.innerHTML = message;
}

function renderProfileCheck(profile) {
  if (!profile) {
    profileCheck.className = 'profile-check warn';
    profileCheck.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      No profile data found. Please set up your profile.
    `;
    return false;
  }
  const filledFields = Object.values(profile.preset || {}).filter(v => v && v.trim()).length;
  const customCount = (profile.custom || []).filter(c => c.label && c.value).length;
  const total = filledFields + customCount;

  if (total === 0) {
    profileCheck.className = 'profile-check warn';
    profileCheck.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Profile is empty. Add your data first.
    `;
    return false;
  }

  profileCheck.className = 'profile-check ok';
  profileCheck.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    Profile ready — ${total} field${total !== 1 ? 's' : ''} configured
  `;
  return true;
}

async function init() {
  // Check profile
  const result = await new Promise(resolve => chrome.storage.local.get(['jobfill_profile'], resolve));
  const profile = result['jobfill_profile'] || null;
  const profileOk = renderProfileCheck(profile);

  // Check if we can communicate with the content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      setStatus('error', 'Cannot run on this page.');
      return;
    }

    // Try pinging the content script
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        setStatus('error', 'Could not connect to page.<br><small>Try refreshing the tab.</small>');
        return;
      }
      if (!profileOk) {
        setStatus('', '<strong>Profile needed.</strong> Set up your data first.');
        return;
      }
      setStatus('ready', '<strong>Ready.</strong> Click Fill Form to autofill.');
      fillBtn.disabled = false;
    });
  } catch (e) {
    setStatus('error', 'Unexpected error: ' + e.message);
  }
}

fillBtn.addEventListener('click', async () => {
  fillBtn.disabled = true;
  setStatus('filling', 'Filling fields...');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'fill_forms' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      setStatus('error', 'Fill failed. Try refreshing the page.');
      fillBtn.disabled = false;
      return;
    }
    if (response.error) {
      setStatus('error', response.error);
      fillBtn.disabled = false;
      return;
    }
    const { filled } = response;
    if (filled === 0) {
      setStatus('', `No matching fields found on this page.`);
    } else {
      setStatus('ready', `<strong>Done!</strong> Filled ${filled} field${filled !== 1 ? 's' : ''}.`);
    }
    fillBtn.disabled = false;
  });
});

function openProfile() {
  chrome.runtime.openOptionsPage
    ? chrome.runtime.openOptionsPage()
    : chrome.tabs.create({ url: chrome.runtime.getURL('profile.html') });
}

document.getElementById('openProfileBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('profile.html') });
});
document.getElementById('openProfileBtnBottom').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('profile.html') });
});

init();
