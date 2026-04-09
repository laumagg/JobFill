// content.js — form detection & heuristic filling

const FIELD_PATTERNS = {
  firstName: [
    /first[\s_-]?name/i, /given[\s_-]?name/i, /fname/i, /first/i
  ],
  lastName: [
    /last[\s_-]?name/i, /family[\s_-]?name/i, /surname/i, /lname/i, /last/i
  ],
  fullName: [
    /full[\s_-]?name/i, /^name$/i, /your[\s_-]?name/i, /candidate[\s_-]?name/i
  ],
  email: [
    /e[\s_-]?mail/i, /email/i
  ],
  phone: [
    /phone/i, /mobile/i, /cell/i, /telephone/i, /tel/i, /contact[\s_-]?number/i
  ],
  address: [
    /address[\s_-]?1/i, /street[\s_-]?address/i, /^address$/i, /addr/i
  ],
  city: [
    /city/i, /town/i, /municipality/i
  ],
  state: [
    /state/i, /province/i, /region/i
  ],
  zipCode: [
    /zip/i, /postal/i, /post[\s_-]?code/i
  ],
  country: [
    /country/i, /nation/i
  ],
  linkedin: [
    /linkedin/i, /linked[\s_-]?in/i
  ],
  website: [
    /website/i, /portfolio/i, /personal[\s_-]?site/i, /url/i, /web[\s_-]?address/i
  ],
  experience: [
    /experience/i, /work[\s_-]?history/i, /employment/i, /years[\s_-]?of[\s_-]?experience/i
  ],
  education: [
    /education/i, /degree/i, /university/i, /school/i, /qualification/i
  ],
  summary: [
    /summary/i, /cover[\s_-]?letter/i, /about[\s_-]?you/i, /bio/i, /profile/i, /objective/i, /statement/i
  ]
};

function getFieldHints(el) {
  const sources = [
    el.getAttribute('name') || '',
    el.getAttribute('id') || '',
    el.getAttribute('placeholder') || '',
    el.getAttribute('aria-label') || '',
    el.getAttribute('autocomplete') || '',
    el.getAttribute('data-field') || '',
    el.getAttribute('data-label') || '',
  ];

  // Also look at associated <label> element
  const id = el.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) sources.push(label.innerText || '');
  }

  // Look at nearby label (parent or sibling)
  const parent = el.closest('label, .form-group, .field, [class*="field"], [class*="form"]');
  if (parent) {
    const labelEl = parent.querySelector('label, .label, [class*="label"]');
    if (labelEl) sources.push(labelEl.innerText || '');
  }

  return sources.join(' ');
}

function matchField(el, profile) {
  const hints = getFieldHints(el).toLowerCase();
  if (!hints.trim()) return null;

  // Check preset fields
  for (const [key, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(hints)) {
        if (key === 'fullName') {
          const full = [profile.preset.firstName, profile.preset.lastName].filter(Boolean).join(' ');
          return full || null;
        }
        const value = profile.preset[key];
        return value || null;
      }
    }
  }

  // Check custom fields
  for (const custom of (profile.custom || [])) {
    if (!custom.label) continue;
    const labelPattern = new RegExp(custom.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (labelPattern.test(hints)) {
      return custom.value || null;
    }
  }

  return null;
}

function fillInput(el, value) {
  if (!value) return false;

  const tag = el.tagName.toLowerCase();

  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (['submit', 'button', 'reset', 'file', 'checkbox', 'radio', 'hidden'].includes(type)) return false;
    if (el.value && el.value.trim() !== '') return false; // don't overwrite existing data

    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    return true;
  }

  if (tag === 'textarea') {
    if (el.value && el.value.trim() !== '') return false;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    return true;
  }

  if (tag === 'select') {
    const optionMatch = Array.from(el.options).find(opt =>
      opt.text.toLowerCase().includes(value.toLowerCase()) ||
      opt.value.toLowerCase().includes(value.toLowerCase())
    );
    if (optionMatch) {
      el.value = optionMatch.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  return false;
}

function highlightField(el, success) {
  const color = success ? '#22c55e33' : 'transparent';
  const prevBackground = el.style.backgroundColor;
  el.style.transition = 'background-color 0.3s ease';
  el.style.backgroundColor = color;
  setTimeout(() => {
    el.style.backgroundColor = prevBackground;
  }, 1500);
}

async function fillForms() {
  const profile = await new Promise((resolve) => {
    chrome.storage.local.get(['jobfill_profile'], (result) => {
      resolve(result['jobfill_profile'] || null);
    });
  });

  if (!profile) {
    return { filled: 0, total: 0, error: 'No profile found. Please set up your profile first.' };
  }

  const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
  let filled = 0;

  for (const el of inputs) {
    if (!el.offsetParent) continue; // skip hidden elements
    const value = matchField(el, profile);
    const success = fillInput(el, value);
    if (success) {
      highlightField(el, true);
      filled++;
    }
  }

  return { filled, total: inputs.length };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fill_forms') {
    fillForms().then(sendResponse);
    return true; // async
  }
  if (message.action === 'ping') {
    sendResponse({ ok: true });
  }
});
