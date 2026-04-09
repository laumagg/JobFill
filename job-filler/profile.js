// profile.js

const STORAGE_KEY = 'jobfill_profile';

const PRESET_FIELDS = [
  'firstName', 'lastName', 'email', 'phone',
  'address', 'city', 'state', 'zipCode', 'country',
  'linkedin', 'website', 'experience', 'education', 'summary'
];

const saveBtn = document.getElementById('saveBtn');
const saveMsg = document.getElementById('saveMsg');
const customList = document.getElementById('customList');
const addFieldBtn = document.getElementById('addFieldBtn');

let customFields = [];

// --- Load ---
async function loadProfile() {
  const result = await new Promise(resolve => chrome.storage.local.get([STORAGE_KEY], resolve));
  const profile = result[STORAGE_KEY];
  if (!profile) return;

  // Populate preset fields
  for (const key of PRESET_FIELDS) {
    const el = document.getElementById(key);
    if (el && profile.preset && profile.preset[key] !== undefined) {
      el.value = profile.preset[key];
    }
  }

  // Populate custom fields
  customFields = (profile.custom || []).map(f => ({ ...f }));
  renderCustomFields();
}

// --- Save ---
async function saveProfile() {
  const preset = {};
  for (const key of PRESET_FIELDS) {
    const el = document.getElementById(key);
    preset[key] = el ? el.value.trim() : '';
  }

  const custom = customFields
    .filter(f => f.label && f.label.trim())
    .map(f => ({ label: f.label.trim(), value: f.value.trim() }));

  const profile = { preset, custom };

  await new Promise(resolve => chrome.storage.local.set({ [STORAGE_KEY]: profile }, resolve));

  saveMsg.textContent = 'Saved.';
  saveMsg.className = 'save-msg success';
  setTimeout(() => {
    saveMsg.textContent = '';
    saveMsg.className = 'save-msg';
  }, 2500);
}

// --- Custom Fields ---
function renderCustomFields() {
  customList.innerHTML = '';

  customFields.forEach((field, index) => {
    const row = document.createElement('div');
    row.className = 'custom-row';

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.placeholder = 'Field label';
    labelInput.value = field.label || '';
    labelInput.addEventListener('input', e => {
      customFields[index].label = e.target.value;
    });

    const sep = document.createElement('div');
    sep.className = 'custom-sep';

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Value';
    valueInput.value = field.value || '';
    valueInput.addEventListener('input', e => {
      customFields[index].value = e.target.value;
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Remove field';
    removeBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
      </svg>
    `;
    removeBtn.addEventListener('click', () => {
      customFields.splice(index, 1);
      renderCustomFields();
    });

    row.appendChild(labelInput);
    row.appendChild(sep);
    row.appendChild(valueInput);
    row.appendChild(removeBtn);
    customList.appendChild(row);
  });
}

addFieldBtn.addEventListener('click', () => {
  customFields.push({ label: '', value: '' });
  renderCustomFields();
  // Focus the new label input
  const rows = customList.querySelectorAll('.custom-row');
  const last = rows[rows.length - 1];
  if (last) last.querySelector('input').focus();
});

saveBtn.addEventListener('click', saveProfile);

// Keyboard shortcut: Ctrl+S / Cmd+S
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveProfile();
  }
});

loadProfile();
