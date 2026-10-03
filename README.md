# EcoScan AI — Waste Classification Web Prototype

> **"A better planet. One scan at a time."**  
> AI-assisted waste classification and segregation platform built for sustainable environmental habits.

---

## 🌿 Overview

**EcoScan AI** is an intelligent, multimodal AI-assisted waste classification platform designed to guide sustainable waste segregation habits. It empowers users to photograph household items, instantly receive waste segregation classifications (**Biodegradable** vs **Non-Biodegradable**) with designated bin recommendations under Indian SWM guidelines, and track daily progress through an interactive, gamified claymorphic dashboard.

### 🌐 Live Deployment & Local Entrypoints
- **Live GitHub Pages URL**: [https://kumarsachin1240421-code.github.io/CHE-110/](https://kumarsachin1240421-code.github.io/CHE-110/)
- **Local Express Server**: `http://localhost:8088`

---

## ✨ Features Implemented

### 1. Glassmorphic Hero Section
- **Nature-Inspired Backdrop**: Crisp foliage with dark forest green overlays (`#173D32`, `#0D251E`) paired with fresh lime accents (`#C5EF83`).
- **Clean Full-Screen Viewport**: 100vh hero displaying the 3-step pipeline (**Scan → Sort → Grow**), real-time scan preview, and authenticated sign-in/registration module.
- **Custom Brand Emblem**: Distinct squircle leaf emblem with scanner brackets.

### 2. Authenticated Claymorphic Dashboard
- **Tactile 3D Claymorphism**: Soft, interactive clay buttons and active states on a clean ceramic backdrop.
- **Tab 1: Home (Waste Scanner & Segregation)**:
  - Real-time device camera viewfinder capture ("Snap a Frame") and drag-and-drop file upload options.
  - Multimodal AI-backed recognition (Google Gemini Vision API) categorizing items into Biodegradable or Non-Biodegradable with dustbin color coding (Green Bin for wet/organic, Blue Bin for dry recyclables).
  - Completed scan verification with animated "Done" checkmark and a 24-hour ephemeral scan history log.
  - "I Put This in the Dustbin" sort confirmation action.
- **Tab 2: Progress (Gamification & Badges)**:
  - Eco-Points reward mechanics granting points per verified disposal.
  - Milestone progress tracker unlocking badges: *Eco Seedling*, *Green Scout*, *Earth Guardian*, *Forest Ranger*, and *Planet Champion*.
- **Tab 3: Facts, Daily Tips & Reviews**:
  - Dynamically generated daily environmental facts and practical eco-friendly advice.
  - Authenticated user review submission form with star ratings.

### 3. Supabase Authentication & Session Persistence
- **Secure Cloud Auth**: Integrated with Supabase Auth (`supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`).
- **Automatic Session Recovery**: Seamless session restore on page refresh using `supabase.auth.getSession()`.
- **Safe Fallback**: Graceful local authentication fallback if offline or during local development.

### 4. Community Reviews & Social Verification
- **User-Generated Submissions**: Dynamic reviews stored with user identity.
- **Community Upvoting**: Real-time upvoting/liking system sorting reviews dynamically by popularity.
- **Author-Restricted Deletion**: Delete actions are strictly restricted to the review's original author.

### 5. Network Resilience & Profile Customization
- **Offline Buffering Modal**: Automated offline detector triggering an eco-themed floating bin illustration modal during network drops.
- **Profile Management**: Custom display name updates and webcam/file avatar customization with persistent badge rendering.
- **Support Modal**: Instant contact assistance overlay (`ecoscan123@gmail.com` / `+91 1800-267-3267`).

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Google Gemini API Key
- Supabase Project URL & Anon Key (optional for cloud auth)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kumarsachin1240421-code/CHE-110.git
   cd CHE-110
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your keys in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=8088
   ```

4. **Start the local server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:8088](http://localhost:8088) in your browser.

---

## 🗂️ Project File Structure

```
CHE-110/
├── index.html            # Main semantic HTML structure & layout
├── manifest.json         # PWA configuration
├── favicon.png           # High-resolution favicon
├── package.json          # Project dependencies & scripts
├── server.js             # Node/Express backend for Gemini Vision & Supabase config
├── .env.example          # Environment variables template
├── README.md             # Project documentation
├── assets/
│   ├── images/
│   │   ├── forest_bg.jpg        # Nature backdrop
│   │   ├── plastic_bottle.jpg   # Hero scan sample
│   │   ├── banana_peel.jpg      # Organic waste sample
│   │   ├── soda_can.jpg         # Metal sample
│   │   └── cardboard_box.jpg    # Paper sample
│   └── icons/
│       └── logo_icon.png        # Leaf squircle emblem
├── css/
│   ├── main.css          # Design system tokens, typography, toasts, modal base
│   ├── welcome.css       # 3-column hero, frosted card, reviews, FAQ widget
│   └── animations.css    # Confetti celebrations and transitions
└── js/
    ├── mockData.js       # Indian sample reviews and FAQ data
    ├── auth.js           # Supabase authentication & session persistence
    └── app.js            # Scanner controller, camera, tabs, reviews, profile
```

---

*Built with 🌱 for CHE-110 Hackathon Demo.*
