// storage.js — shared Chrome storage helpers

const STORAGE_KEY = 'jobfill_profile';

async function getProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || defaultProfile());
    });
  });
}

async function saveProfile(profile) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: profile }, resolve);
  });
}

function defaultProfile() {
  return {
    preset: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      linkedin: '',
      website: '',
      experience: '',
      education: '',
      summary: '',
    },
    custom: [] // [{ label: string, value: string }]
  };
}
