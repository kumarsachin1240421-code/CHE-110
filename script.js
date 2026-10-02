/**
 * EcoScan AI — Campus Waste Classification Portal
 * Interactive Logic & Falling Leaves Simulation
 */

document.addEventListener('DOMContentLoaded', () => {
  initLeavesSystem();
  initAuthTabs();
  initPasswordToggle();
  initFormHandling();
  initClusterSwitcher();
  initParallaxEffect();
});

/* ==========================================================================
   1. Falling Autumn Leaves CSS Keyframe Simulation System
   ========================================================================== */

function initLeavesSystem() {
  const container = document.getElementById('leavesContainer');
  if (!container) return;

  // Curated autumn color palette matching the mountain road background
  const leafColors = [
    { fill: '#e85d04', stroke: '#dc2f02' }, // Burnt Maple
    { fill: '#f48c06', stroke: '#d97706' }, // Golden Amber
    { fill: '#faa307', stroke: '#b45309' }, // Warm Honey
    { fill: '#c0392b', stroke: '#962d22' }, // Deep Crimson
    { fill: '#d35400', stroke: '#a04000' }, // Rust Orange
    { fill: '#b7791f', stroke: '#975a16' }, // Golden Ochre
    { fill: '#78682a', stroke: '#5b4f20' }  // Mossy Gold
  ];

  // SVG Leaf Shape Templates
  const leafShapes = [
    // 1. Maple Leaf Silhouette
    (color) => `
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2C19.5 7 14 9 10 7C11.5 12 8 14 4 15C8 18 8 22 5 25C10 25 12 28 12 32L19 28V38H21V28L28 32C28 28 30 25 35 25C32 22 32 18 36 15C32 14 28.5 12 30 7C26 9 20.5 7 20 2Z" 
              fill="${color.fill}" fill-opacity="0.9" stroke="${color.stroke}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M20 12V34M20 20L13 14M20 20L27 14M20 25L15 22M20 25L25 22" 
              stroke="${color.stroke}" stroke-width="1" stroke-linecap="round" opacity="0.65"/>
      </svg>
    `,

    // 2. Oak Leaf Silhouette
    (color) => `
      <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 2C15 6 12 6 10 9C8 12 10 15 7 17C4 19 6 23 8 26C10 29 9 32 12 35L17 37V42H19V37L24 35C27 32 26 29 28 26C30 23 32 19 29 17C26 15 28 12 26 9C24 6 21 6 18 2Z" 
              fill="${color.fill}" fill-opacity="0.92" stroke="${color.stroke}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M18 6V39M18 16L12 13M18 16L24 13M18 24L10 21M18 24L26 21M18 31L13 28M18 31L23 28" 
              stroke="${color.stroke}" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `,

    // 3. Birch / Aspen Leaf
    (color) => `
      <svg viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C10 9 4 16 6 26C7 31 11 34 15 34V37H17V34C21 34 25 31 26 26C28 16 22 9 16 2Z" 
              fill="${color.fill}" fill-opacity="0.88" stroke="${color.stroke}" stroke-width="1.2"/>
        <path d="M16 5V34M16 14L9 11M16 14L23 11M16 22L8 18M16 22L24 18M16 28L11 25M16 28L21 25" 
              stroke="${color.stroke}" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `,

    // 4. Elm / Ash Small Flutter Leaf
    (color) => `
      <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2C9 9 5 17 8 26C10 31 12 32 13 32V35H15V32C16 32 18 31 20 26C23 17 19 9 14 2Z" 
              fill="${color.fill}" fill-opacity="0.94" stroke="${color.stroke}" stroke-width="1.1"/>
        <path d="M14 5V32M14 13L9 10M14 13L19 10M14 21L8 17M14 21L20 17" 
              stroke="${color.stroke}" stroke-width="0.8" stroke-linecap="round" opacity="0.65"/>
      </svg>
    `
  ];

  // Number of simultaneous drifting leaves for realistic, immersive atmosphere
  const TOTAL_LEAVES = 26;

  for (let i = 0; i < TOTAL_LEAVES; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf-particle';

    const color = leafColors[Math.floor(Math.random() * leafColors.length)];
    const shapeFn = leafShapes[Math.floor(Math.random() * leafShapes.length)];

    // Depth Layer Category (Foreground, Midground, Background)
    const layer = Math.random();
    let size, fallDuration, swayDuration, blur, opacity, swayDistance;

    if (layer < 0.25) {
      // Foreground: Larger, slightly out of focus, fast breezy drift
      size = 38 + Math.random() * 16; // 38px - 54px
      fallDuration = 9 + Math.random() * 5; // 9s - 14s
      swayDuration = 3.5 + Math.random() * 2;
      swayDistance = 110 + Math.random() * 50;
      blur = 1.2;
      opacity = 0.85;
    } else if (layer < 0.7) {
      // Midground: Sharp, medium speed, prominent 3D flutter
      size = 24 + Math.random() * 14; // 24px - 38px
      fallDuration = 13 + Math.random() * 7; // 13s - 20s
      swayDuration = 4.2 + Math.random() * 2.5;
      swayDistance = 70 + Math.random() * 45;
      blur = 0;
      opacity = 0.95;
    } else {
      // Background: Distant, gentle floating, soft
      size = 14 + Math.random() * 10; // 14px - 24px
      fallDuration = 19 + Math.random() * 10; // 19s - 29s
      swayDuration = 5 + Math.random() * 3;
      swayDistance = 40 + Math.random() * 35;
      blur = 0.6;
      opacity = 0.75;
    }

    // Horizontal placement across the entire window
    const startX = Math.random() * 105 - 2.5; // -2.5% to 102.5%
    
    // Negative animation delays so leaves appear already falling in mid-air on page load!
    const fallDelay = -(Math.random() * fallDuration);
    const swayDelay = -(Math.random() * swayDuration);
    const flipDelay = -(Math.random() * 6);

    leaf.style.width = `${size}px`;
    leaf.style.height = `${size * 1.15}px`;
    leaf.style.left = `${startX}vw`;
    leaf.style.setProperty('--sway-distance', `${swayDistance}px`);
    leaf.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    leaf.style.opacity = opacity;

    // Apply synchronized independent CSS keyframes for fall, sway & 3D rotation
    leaf.style.animationDuration = `${fallDuration}s, ${swayDuration}s, ${swayDuration * 1.2}s`;
    leaf.style.animationDelay = `${fallDelay}s, ${swayDelay}s, ${flipDelay}s`;

    leaf.innerHTML = shapeFn(color);
    container.appendChild(leaf);
  }
}

/* ==========================================================================
   2. Auth Mode Tab Switching (Sign In / Sign Up)
   ========================================================================== */

function initAuthTabs() {
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const tabsContainer = document.querySelector('.auth-tabs');
  const cardTitle = document.getElementById('cardTitle');
  const cardDesc = document.getElementById('cardDesc');
  const btnText = document.getElementById('btnText');
  const submitBtn = document.getElementById('submitBtn');

  if (!tabSignIn || !tabSignUp || !tabsContainer) return;

  tabSignIn.addEventListener('click', () => {
    if (tabSignIn.classList.contains('active')) return;
    tabSignIn.classList.add('active');
    tabSignIn.setAttribute('aria-selected', 'true');
    tabSignUp.classList.remove('active');
    tabSignUp.setAttribute('aria-selected', 'false');
    tabsContainer.classList.remove('signup-active');

    cardTitle.textContent = 'Campus Portal';
    cardDesc.textContent = 'Automated Sorting & Admin Access';
    btnText.textContent = 'Log in';
  });

  tabSignUp.addEventListener('click', () => {
    if (tabSignUp.classList.contains('active')) return;
    tabSignUp.classList.add('active');
    tabSignUp.setAttribute('aria-selected', 'true');
    tabSignIn.classList.remove('active');
    tabSignIn.setAttribute('aria-selected', 'false');
    tabsContainer.classList.add('signup-active');

    cardTitle.textContent = 'Station Access';
    cardDesc.textContent = 'Register New Campus Sorting Node';
    btnText.textContent = 'Request Node Credentials';
  });
}

/* ==========================================================================
   3. Password Visibility Toggle
   ========================================================================== */

function initPasswordToggle() {
  const toggleBtn = document.getElementById('passwordToggle');
  const passwordInput = document.getElementById('passwordField');

  if (!toggleBtn || !passwordInput) return;

  let isShown = false;

  toggleBtn.addEventListener('click', () => {
    isShown = !isShown;
    passwordInput.type = isShown ? 'text' : 'password';

    if (isShown) {
      // Eye-off SVG icon
      toggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
          <line x1="2" x2="22" y1="2" y2="22"/>
        </svg>
      `;
      toggleBtn.setAttribute('aria-label', 'Hide password');
    } else {
      // Eye SVG icon
      toggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
      toggleBtn.setAttribute('aria-label', 'Show password');
    }
  });
}

/* ==========================================================================
   4. Form Submission & Validation Simulation
   ========================================================================== */

function initFormHandling() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('campusEmail');
  const passwordInput = document.getElementById('passwordField');
  const submitBtn = document.getElementById('submitBtn');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset errors
    emailError.classList.remove('visible');
    passwordError.classList.remove('visible');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;

    if (!email || !validateEmail(email)) {
      emailError.textContent = 'Please enter a valid campus or operator email address.';
      emailError.classList.add('visible');
      hasError = true;
    }

    if (!password || password.length < 4) {
      passwordError.textContent = 'Password must be at least 4 characters.';
      passwordError.classList.add('visible');
      hasError = true;
    }

    if (hasError) return;

    // Simulate authenticating
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;

      const cluster = document.getElementById('clusterName')?.textContent || 'North Campus Station';
      showToast({
        title: 'Authentication Successful',
        message: `Connected to ${cluster} with verified vision access.`,
        type: 'success'
      });
    }, 1100);
  });

  // Secondary Links Action Feedback
  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast({
        title: 'Password Recovery',
        message: 'A recovery link has been dispatched to your designated campus system administrator.',
        type: 'info'
      });
    });
  }

  const requestLink = document.getElementById('requestAccessLink');
  if (requestLink) {
    requestLink.addEventListener('click', (e) => {
      e.preventDefault();
      const tabSignUp = document.getElementById('tabSignUp');
      if (tabSignUp) tabSignUp.click();
    });
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================================================
   5. Interactive Cluster Node Selection
   ========================================================================== */

function initClusterSwitcher() {
  const clusterRow = document.querySelector('.cluster-status-row');
  const clusterName = document.getElementById('clusterName');
  if (!clusterRow || !clusterName) return;

  clusterRow.style.cursor = 'pointer';
  clusterRow.title = 'Click to switch campus node cluster';

  const clusters = [
    'North Campus Station',
    'Engineering Quad Bin #4',
    'Student Center Hub',
    'Science Complex Node',
    'South Residential Facility'
  ];

  let currentIndex = 0;

  clusterRow.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % clusters.length;
    clusterName.style.opacity = '0';
    setTimeout(() => {
      clusterName.textContent = clusters[currentIndex];
      clusterName.style.opacity = '1';
    }, 150);

    showToast({
      title: 'Cluster Routing Updated',
      message: `Active station route: ${clusters[currentIndex]} (Telemetry latency: 12ms)`,
      type: 'info'
    });
  });
}

/* ==========================================================================
   6. Subtle Mouse Parallax on Desktop
   ========================================================================== */

function initParallaxEffect() {
  // Only apply smooth parallax on desktops with fine pointers
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const bgImage = document.getElementById('bgImage');
  const glassCard = document.getElementById('glassLoginCard');
  if (!bgImage || !glassCard) return;

  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;

  window.addEventListener('mousemove', (e) => {
    const { innerWidth, innerHeight } = window;
    mouseX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
    mouseY = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
  });

  function renderParallax() {
    currentX += (mouseX - currentX) * 0.04;
    currentY += (mouseY - currentY) * 0.04;

    bgImage.style.transform = `scale(1.04) translate(${currentX * -10}px, ${currentY * -8}px)`;
    glassCard.style.transform = `perspective(1000px) rotateY(${currentX * 2.5}deg) rotateX(${currentY * -2.5}deg)`;

    requestAnimationFrame(renderParallax);
  }

  requestAnimationFrame(renderParallax);
}

/* ==========================================================================
   7. Glass Toast Notification System
   ========================================================================== */

function showToast({ title, message, type = 'success' }) {
  const container = document.getElementById('toastWrapper');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg = type === 'success' ? `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ` : `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  `;

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 320);
  }, 3800);
}
