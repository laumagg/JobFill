# JobFill

A Chrome extension that autofills job application forms with your personal data. One click, any site, completely free.

No AI dependency. No API keys. No subscription.

---

## Features

- **One-click form filling** — trigger from the extension popup on any job application page
- **Profile manager** — store preset fields (name, email, address, LinkedIn, experience, education) plus unlimited custom fields
- **Heuristic field matching** — matches form inputs using label text, `name`, `id`, `placeholder`, and `aria-label` attributes
- **Non-destructive** — never overwrites fields that already have a value
- **Visual feedback** — filled fields briefly highlight green on fill
- **Local storage only** — all data stays in your browser via Chrome storage, nothing is sent anywhere

---

## Installation

This extension is not on the Chrome Web Store. Install it manually:

1. Download or clone this repository
2. Go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the `job-filler` folder
6. Pin the extension to your toolbar

---

## Usage

1. Click the JobFill icon in your toolbar
2. Click **Manage Profile** and fill in your data → Save
3. Navigate to any job application page
4. Click the JobFill icon → **Fill Form**
5. Filled fields will briefly highlight green

---

## Limitations

- Heavily JS-rendered forms (e.g. Workday, iCIMS, Taleo) may use shadow DOM or custom components that resist standard input filling
- Select dropdowns are matched by option text; uncommon value formats may not match
- Rich text editors (e.g. Quill, TipTap) are not supported


---

## License

MIT
