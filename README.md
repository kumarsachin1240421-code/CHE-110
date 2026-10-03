# EcoScan AI — Waste Classification Web Prototype

> **"A better planet. One scan at a time."**  
> AI-inspired waste-classification frontend prototype built for hackathon demonstration.

---

Update the `README.md` file with the following complete documentation. Keep the project file structure exactly as it is, update the live URL to GitHub Pages, and document all recently implemented features (multimodal Gemini AI, claymorphic authenticated dashboard, dynamic reviews, 24h history, and network buffering):

```markdown
## 🌿 Overview & Prototype Mode

**EcoScan AI** is an intelligent, multimodal AI-assisted waste classification platform designed to guide sustainable waste segregation habits. It empowers users to photograph household items, instantly receive waste segregation classifications (Biodegradable vs Non-Biodegradable) with designated bin recommendations under Indian SWM guidelines, and track daily progress through an interactive, gamified claymorphic dashboard.

### 🌐 Live Deployment & Local Entrypoints
- **Live GitHub Pages URL**: **https://kumarsachin1240421-code.github.io/CHE-110/**
✨ Features Implemented
Exact Reference Hero Section (Glassmorphism):

Nature-inspired backdrop featuring moss, foliage, and sunlight accents.

Dark forest green overlay (#173D32, #0D251E) paired with fresh lime accents (#C5EF83).

Clean full-screen hero viewport (100vh) without bottom content visible on load; strictly displays the 3-step pipeline (Scan → Sort → Grow), real-time scan preview, and authenticated sign-in/registration module.

Visible brand logo with the EcoScan AI emblem.

Authenticated Dashboard (3D Tactile Claymorphism):

Dedicated post-login interface set against a clean, light ceramic backdrop with soft 3D claymorphic interactive buttons and active states.

Tab 1: Home (Waste Scanner & Segregation):

Real-time device camera viewfinder capture ("Snap a Frame") and manual file upload options.

Multimodal AI-backed recognition (Google Gemini API) categorizing waste into Biodegradable or Non-Biodegradable alongside designated dustbin color coding (e.g., Green Bin for organic/wet, Blue Bin for dry recyclables).

Completed scan verification with animated "Done" checkmark and a 24-hour ephemeral scan history log.

"I Put This in the Dustbin" sort confirmation action.

Tab 2: Progress (Gamification & Badges):

Eco-Points reward mechanics granting points per verified disposal.

Milestone progress tracker unlocking aesthetic badges (Eco Seedling, Green Scout, Earth Guardian, Forest Ranger, Planet Champion).

Tab 3: Facts, Daily Tips & Reviews:

Dynamically generated daily environmental facts and practical eco-friendly advice.

Authenticated user review submission form with star ratings.

Community Review & Upvoting System:

Zero hardcoded or mock testimonials; strictly showcases authentic, user-generated submissions.

Public view accessible from the landing page navigation.

Community upvoting/liking system dynamically sorting reviews by popularity in descending order.

Author-restricted deletion: Delete controls are strictly reserved for logged-in review owners.

Network Resilience & Profile Customization:

Automated offline detector triggering an eco-themed network buffering illustration modal during connectivity drops.

Comprehensive profile management allowing custom name updates and avatar capture via webcam or device storage.

Contact support accessible via modal overlay (ecoscan123@gmail.com / +91 1800-267-3267).


🗂️ Project File Structure

CHE-110/
├── index.html            # Main semantic HTML structure
├── manifest.json         # PWA configuration
├── favicon.png           # High-resolution favicon
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
    ├── auth.js           # Client-side authentication simulation
    └── app.js            # Smooth scroll, modal controller, FAQ accordion

---

*Built with 🌱 for CHE-110 Hackathon Demo.*
