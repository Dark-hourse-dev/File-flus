# FileFlux — Installation Guide

## 🚀 Chrome / Brave / Edge Installation

1. Open your browser and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top-right)
3. Click **"Load unpacked"**
4. Select the **`extension/`** folder from this project
5. Done! The ⚡ FileFlux icon appears in your toolbar

> **Shortcut:** Press `Alt+F` to open FileFlux anytime!

---

## 🦊 Firefox Installation

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on"**
3. Select the **`extension/manifest-firefox.json`** file
4. Done! FileFlux is loaded

> For permanent Firefox installation, the extension needs to be signed via [addons.mozilla.org](https://addons.mozilla.org)

---

## 🖥️ Dashboard (Local)

```bash
cd dashboard
npm install
npm start
# → Open http://localhost:3000
```

---

## 📁 Project Structure

```
Extension/
├── extension/          # The browser extension
│   ├── manifest.json       # Chrome/Brave/Edge (Manifest V3)
│   ├── manifest-firefox.json  # Firefox (Manifest V2)
│   ├── icons/              # Extension icons
│   ├── pages/
│   │   ├── popup.html      # Extension popup UI
│   │   ├── popup.css       # Popup styles
│   │   ├── viewer.html     # Full-screen file viewer
│   │   └── viewer.css      # Viewer styles
│   ├── css/
│   │   └── main.css        # Shared design system
│   └── js/
│       ├── background.js   # Service worker (MV3)
│       ├── content.js      # Page content script
│       ├── popup.js        # Popup controller
│       ├── viewer.js       # File viewer controller
│       ├── fileTypes.js    # File type registry (80+ formats)
│       └── analytics.js    # Analytics client
│
└── dashboard/          # Admin monitoring site
    ├── server.js           # Express API server
    ├── package.json
    └── public/
        ├── index.html      # Dashboard SPA
        ├── css/
        │   └── dashboard.css
        └── js/
            └── dashboard.js
```

---

## ✨ Features

### Extension
- **Open 80+ file formats** directly in browser tab
- **Drag & drop** files from desktop
- **URL paste** to open remote files
- **Page scanner** — detects all file links on current page
- **Right-click context menu** — "Open with FileFlux"
- **File converter** — image formats, CSV↔JSON, Markdown→HTML, etc.
- **Text editor** — edit text/code files and save changes
- **Archive browser** — list and extract ZIP files
- **PDF viewer** — paginated with zoom controls
- **Audio/Video player** — built-in with controls
- **Gen-Z × Late 90s** cyberpunk aesthetic

### Dashboard
- **Live activity feed** — real-time file opens
- **User analytics** — DAU, growth charts, browser distribution
- **Feedback collection** — bug reports, feature requests, love notes
- **File format stats** — most-used formats heatmap
- **Health monitoring** — system logs, uptime, error rates
- **Data export** — feedback CSV export

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/health` | GET | System health check |
| `POST /api/analytics` | POST | Receive analytics events |
| `POST /api/feedback` | POST | Receive user feedback |
| `GET /api/stats` | GET | Get analytics summary |
| `GET /api/feedback` | GET | List feedback items |

---

## 🎨 Theme

The design blends:
- **Gen-Z aesthetic** — neon gradients, glassmorphism, bold typography
- **Late 90s retro** — pixel fonts (Press Start 2P), scanlines, glitch effects, chunky UI elements
- Colors: `#00f5ff` (neon cyan), `#ff2d9e` (hot pink), `#b14aed` (electric purple), `#39ff14` (matrix green)
