/**
 * EcoScan AI - Authentication Controller (Simulated Prototype)
 * Local form handling with client state. Zero external secrets.
 */

export function initAuth(showToast, onAuthSuccess) {
  const loginTabBtn = document.getElementById('tab-login');
  const signupTabBtn = document.getElementById('tab-signup');
  const authForm = document.getElementById('auth-form');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authTitle = document.getElementById('auth-title');
  const signupFieldsWrap = document.getElementById('signup-fields-wrap');
  const authSwitchLink = document.getElementById('auth-switch-link');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const nameInput = document.getElementById('name-input');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const passwordToggleBtn = document.getElementById('password-toggle-btn');
  const eyeIcon = document.getElementById('eye-icon');

  let currentMode = 'login'; // 'login' or 'signup'

  function setMode(mode) {
    currentMode = mode;
    if (mode === 'login') {
      if (loginTabBtn) loginTabBtn.classList.add('active');
      if (signupTabBtn) signupTabBtn.classList.remove('active');
      if (authTitle) authTitle.textContent = 'Welcome back';
      if (authSubmitBtn) authSubmitBtn.textContent = 'Log in';
      if (signupFieldsWrap) signupFieldsWrap.style.display = 'none';
      if (emailInput) emailInput.placeholder = 'example@gmail.com';
      if (passwordInput) passwordInput.placeholder = 'enter your password';
      if (authSwitchLink) {
        authSwitchLink.innerHTML = '<span class="auth-switch-text">New here? <a id="switch-to-signup">Create an account</a></span>';
      }
    } else {
      if (signupTabBtn) signupTabBtn.classList.add('active');
      if (loginTabBtn) loginTabBtn.classList.remove('active');
      if (authTitle) authTitle.textContent = 'Create your account';
      if (authSubmitBtn) authSubmitBtn.textContent = 'Create account';
      if (signupFieldsWrap) signupFieldsWrap.style.display = 'flex';
      if (nameInput) nameInput.placeholder = 'enter your name';
      if (emailInput) emailInput.placeholder = 'example@gmail.com';
      if (passwordInput) passwordInput.placeholder = 'enter your password';
      if (authSwitchLink) {
        authSwitchLink.innerHTML = '<span class="auth-switch-text">Already have an account? <a id="switch-to-login">Log in</a></span>';
      }
    }
    attachSwitchListeners();
  }

  function attachSwitchListeners() {
    const toSignup = document.getElementById('switch-to-signup');
    const toLogin = document.getElementById('switch-to-login');
    if (toSignup) toSignup.addEventListener('click', () => setMode('signup'));
    if (toLogin) toLogin.addEventListener('click', () => setMode('login'));
  }

  if (loginTabBtn) loginTabBtn.addEventListener('click', () => setMode('login'));
  if (signupTabBtn) signupTabBtn.addEventListener('click', () => setMode('signup'));

  // Password visibility toggle
  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword 
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  // Forgot password handler
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Prototype Demo', 'Password reset is simulated in prototype mode. Enter any password to proceed.', 'info');
    });
  }

  // Form Submission
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email-input')?.value.trim();
      const password = passwordInput?.value;

      if (!email || !email.includes('@')) {
        showToast('Invalid Email', 'Please enter a valid email address.', 'warning');
        return;
      }

      if (!password || password.length < 4) {
        showToast('Password Short', 'Password should have at least 4 characters for this demo.', 'warning');
        return;
      }

      authSubmitBtn.disabled = true;
      authSubmitBtn.textContent = 'Processing...';

      setTimeout(() => {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = currentMode === 'login' ? 'Log in' : 'Create account';

        // Retrieve existing user or create clean user profile
        let existingUser = null;
        try {
          existingUser = JSON.parse(localStorage.getItem('ecoscan_current_user') || 'null');
        } catch {}

        let displayName = '';
        if (currentMode === 'signup') {
          displayName = nameInput?.value.trim() || 'Eco Member';
        } else {
          displayName = (existingUser && existingUser.email === email && existingUser.name)
            ? existingUser.name
            : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
        }

        const user = {
          id: existingUser?.id || 'usr_' + Date.now(),
          name: displayName,
          email: email,
          avatar: existingUser?.avatar || null,
          points: existingUser?.points ?? 0,
          sorts: existingUser?.sorts ?? 0,
          scans: existingUser?.scans ?? 0,
          history: existingUser?.history || [],
          recentScans: existingUser?.recentScans || [],
          isLoggedIn: true
        };

        localStorage.setItem('ecoscan_current_user', JSON.stringify(user));

        showToast(
          currentMode === 'login' ? `Welcome back, ${displayName}!` : `Account Created!`,
          `Logged into your EcoScan AI Dashboard.`,
          'success'
        );

        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess(user);
        }
      }, 400);
    });
  }

  attachSwitchListeners();
}
