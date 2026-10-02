# EcoScan AI — Waste Classification Web Prototype

> **"A better planet. One scan at a time."**  
> AI-inspired waste-classification frontend prototype built for hackathon demonstration.

---

## 🌿 Overview & Prototype Mode

**EcoScan AI** is an intelligent waste-classification prototype designed to help users identify recyclable, organic, and hazardous materials, guiding sustainable disposal habits and encouraging daily circular-economy micro-actions.

### 🌐 Live Localhost URL
- **[http://localhost:8088/](http://localhost:8088/)**
- Direct entrypoint: **[http://localhost:8088/index.html](http://localhost:8088/index.html)**

---

## ✨ Features Implemented

1. **Exact Reference Hero Section**:
   - Nature-inspired photography background with dewy emerald moss, ferns, and dappled sunlight.
   - Dark forest green overlay (`#173D32`, `#0D251E`) paired with fresh lime (`#C5EF83`).
   - 3-Column layout:
     - **Left Column**: Headline (*“A better planet. One scan at a time.”*), subtext, and 3-step pipeline (**Scan** → **Sort** → **Grow**) with frosted circular icons and connecting lines.
     - **Center Column**: Floating scan preview card showing the plastic bottle on moss with white viewfinder corner brackets and lime `Plastic` badge.
     - **Right Column**: Frosted-glass login card with `backdrop-filter: blur(24px)`, Login/Sign up tabs, custom SVG input icons, show/hide password toggle, "Remember me" checkbox, full-width lime submit button, and `─── New here? Create an account ───`.
   - **No `01 / WELCOME`**: Completely removed from the hero and header.
   - Visible brand logo and **EcoScan AI** title on the top left.

2. **Reviews with Everyday Indian Samples**:
   - Smooth-scrolling navigation when clicking **Reviews**.
   - Testimonials featuring everyday Indian household items:
     - Rinsing and attaching corner snippets of plastic milk packets (Amul/Mother Dairy) for *Sookha Kachra* (dry recyclables).
     - Poly-lined roadside chai paper cups vs dry cardboard segregation.
     - Crushing PET mineral water bottles for municipal collection.
     - *Geela Kachra* (wet kitchen food scraps) segregation under Indian SWM 2016 guidelines.
   - Real user locations: Pune, South Delhi, Bengaluru, and Jaipur.

3. **Official Support Modal**:
   - Clicking **Support** in the header opens an accessible modal with:
     - **Official email**: `ecoscan123@gmail.com`
     - **Helpline number**: `+91 1800-267-3267`
     - Accessible close button and Escape key dismiss.

4. **Right-Downside Frequently Asked Questions (FAQ) Widget**:
   - Docked on the bottom-right corner of the screen.
   - Clean expandable accordion answering the top questions users ask regarding Indian waste rules, milk pouches, chai cups, support channels, and offline prototype usage.

---

## 🗂️ Project File Structure

```text
CHE-110/
├── index.html            # Main semantic HTML structure
├── manifest.json         # PWA configuration
├── favicon.png           # High-resolution favicon
├── README.md             # Project documentation
├── assets/
│   ├── images/
│   │   ├── forest_bg.jpg       # Nature backdrop
│   │   ├── plastic_bottle.jpg  # Hero scan sample
│   │   ├── banana_peel.jpg     # Organic waste sample
│   │   ├── soda_can.jpg        # Metal sample
│   │   └── cardboard_box.jpg   # Paper sample
│   └── icons/
│       └── logo_icon.png       # Leaf squircle emblem
├── css/
│   ├── main.css          # Design system tokens, typography, toasts, modal base
│   ├── welcome.css       # 3-column hero, frosted card, reviews, FAQ widget
│   └── animations.css    # Confetti celebrations and transitions
└── js/
    ├── mockData.js       # Indian sample reviews and FAQ data
    ├── auth.js           # Client-side authentication simulation
    └── app.js            # Smooth scroll, modal controller, FAQ accordion
```

---

*Built with 🌱 for CHE-110 Hackathon Demo.*
