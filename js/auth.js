/**
 * EcoScan AI - Supabase Authentication Controller
 * Connects Supabase authentication and database using environment variables securely.
 */

// Supabase Configuration Keys (configured in .env / .env.local or customized here)
const SUPABASE_URL = "your_supabase_url_here";
const SUPABASE_ANON_KEY = "your_supabase_anon_key_here";

export let supabase = null;

/**
 * Initializes the Supabase client safely with provided or environment variables
 */
function createSupabaseInstance(url, key) {
  if (!url || !key || url === "your_supabase_url_here" || !url.startsWith("http")) {
    return null;
  }
  try {
    if (typeof window !== "undefined" && window.supabase && typeof window.supabase.createClient === "function") {
      return window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
  } catch (err) {
    console.warn("Supabase client initialization warning:", err);
  }
  return null;
}

// Initial attempt using declared constants
supabase = createSupabaseInstance(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Formats a Supabase User object into an EcoScan AI user profile
 */
function formatUserData(supaUser, fallbackName = "") {
  if (!supaUser) return null;
  const metadata = supaUser.user_metadata || {};
  let existingUser = null;
  try {
    existingUser = JSON.parse(localStorage.getItem("ecoscan_current_user") || "null");
  } catch {}

  const displayName = metadata.name || fallbackName || (supaUser.email ? supaUser.email.split("@")[0] : "Eco Member");

  return {
    id: supaUser.id,
    name: displayName,
    email: supaUser.email || "",
    avatar: metadata.avatar || existingUser?.avatar || null,
    points: existingUser?.points ?? 0,
    sorts: existingUser?.sorts ?? 0,
    scans: existingUser?.scans ?? 0,
    history: existingUser?.history || [],
    recentScans: existingUser?.recentScans || [],
    isLoggedIn: true
  };
}

/**
 * Signs out the current user from Supabase and clears local session
 */
export async function signOutUser() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
  }
  try {
    const user = JSON.parse(localStorage.getItem("ecoscan_current_user") || "null");
    if (user) {
      user.isLoggedIn = false;
      localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
    }
  } catch {}
}

/**
 * Initializes Authentication, UI tabs, Form validation, and Session Persistence
 */
export function initAuth(showToast, onAuthSuccess) {
  const loginTabBtn = document.getElementById("tab-login");
  const signupTabBtn = document.getElementById("tab-signup");
  const authForm = document.getElementById("auth-form");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authTitle = document.getElementById("auth-title");
  const signupFieldsWrap = document.getElementById("signup-fields-wrap");
  const authSwitchLink = document.getElementById("auth-switch-link");
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const nameInput = document.getElementById("name-input");
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");
  const passwordToggleBtn = document.getElementById("password-toggle-btn");
  const eyeIcon = document.getElementById("eye-icon");

  let currentMode = "login"; // 'login' or 'signup'

  // Fetch server-provided environment variables if available (.env / .env.local)
  async function syncEnvironmentConfig() {
    try {
      const res = await fetch("/api/auth/config");
      const config = await res.json();
      const activeUrl = config.supabaseUrl && config.supabaseUrl !== "your_supabase_url_here" ? config.supabaseUrl : SUPABASE_URL;
      const activeAnonKey = config.supabaseAnonKey && config.supabaseAnonKey !== "your_supabase_anon_key_here" ? config.supabaseAnonKey : SUPABASE_ANON_KEY;

      if (activeUrl && activeAnonKey && activeUrl !== "your_supabase_url_here" && activeUrl.startsWith("http")) {
        supabase = createSupabaseInstance(activeUrl, activeAnonKey);
      }
    } catch (e) {
      console.warn("Could not query /api/auth/config:", e);
    }

    // Check session persistence on page refresh using supabase.auth.getSession()
    await restoreSession();
  }

  // Restore active session on page refresh
  async function restoreSession() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Supabase getSession error:", error);
        return;
      }
      if (data && data.session && data.session.user) {
        const user = formatUserData(data.session.user);
        localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess(user);
        }
      }
    } catch (err) {
      console.warn("Error restoring Supabase session:", err);
    }
  }

  // Listen to Supabase Auth State changes (sign in, sign out, token refresh)
  if (supabase) {
    try {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const user = formatUserData(session.user);
          localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
          if (typeof onAuthSuccess === "function") {
            onAuthSuccess(user);
          }
        } else if (event === "SIGNED_OUT") {
          const user = JSON.parse(localStorage.getItem("ecoscan_current_user") || "null");
          if (user) {
            user.isLoggedIn = false;
            localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
          }
        }
      });
    } catch (e) {}
  }

  // Kick off environment sync & session restoration
  syncEnvironmentConfig();

  function setMode(mode) {
    currentMode = mode;
    if (mode === "login") {
      if (loginTabBtn) loginTabBtn.classList.add("active");
      if (signupTabBtn) signupTabBtn.classList.remove("active");
      if (authTitle) authTitle.textContent = "Welcome back";
      if (authSubmitBtn) authSubmitBtn.textContent = "Log in";
      if (signupFieldsWrap) signupFieldsWrap.style.display = "none";
      if (emailInput) emailInput.placeholder = "example@gmail.com";
      if (passwordInput) passwordInput.placeholder = "enter your password";
      if (authSwitchLink) {
        authSwitchLink.innerHTML = '<span class="auth-switch-text">New here? <a id="switch-to-signup">Create an account</a></span>';
      }
    } else {
      if (signupTabBtn) signupTabBtn.classList.add("active");
      if (loginTabBtn) loginTabBtn.classList.remove("active");
      if (authTitle) authTitle.textContent = "Create your account";
      if (authSubmitBtn) authSubmitBtn.textContent = "Create account";
      if (signupFieldsWrap) signupFieldsWrap.style.display = "flex";
      if (nameInput) nameInput.placeholder = "enter your name";
      if (emailInput) emailInput.placeholder = "example@gmail.com";
      if (passwordInput) passwordInput.placeholder = "enter your password";
      if (authSwitchLink) {
        authSwitchLink.innerHTML = '<span class="auth-switch-text">Already have an account? <a id="switch-to-login">Log in</a></span>';
      }
    }
    attachSwitchListeners();
  }

  function attachSwitchListeners() {
    const toSignup = document.getElementById("switch-to-signup");
    const toLogin = document.getElementById("switch-to-login");
    if (toSignup) toSignup.addEventListener("click", () => setMode("signup"));
    if (toLogin) toLogin.addEventListener("click", () => setMode("login"));
  }

  if (loginTabBtn) loginTabBtn.addEventListener("click", () => setMode("login"));
  if (signupTabBtn) signupTabBtn.addEventListener("click", () => setMode("signup"));

  // Password visibility toggle
  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");
      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
      }
    });
  }

  // Forgot password handler
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = emailInput?.value.trim();
      if (!email || !email.includes("@")) {
        showToast("Enter Email", "Please enter your email address to receive password reset instructions.", "info");
        return;
      }
      if (supabase) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) {
            showToast("Reset Notice", error.message, "warning");
          } else {
            showToast("Reset Link Sent", "Check your inbox for password reset instructions.", "success");
          }
        } catch (err) {
          showToast("Reset Error", err.message, "warning");
        }
      } else {
        showToast("Password Reset", "Add live SUPABASE_URL to .env to enable email password resets.", "info");
      }
    });
  }

  // Form Submission: Real Supabase Authentication
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput?.value.trim();
      const password = passwordInput?.value;

      if (!email || !email.includes("@")) {
        showToast("Invalid Email", "Please enter a valid email address.", "warning");
        return;
      }

      if (!password || password.length < 6) {
        showToast("Password Requirement", "Password must be at least 6 characters long.", "warning");
        return;
      }

      authSubmitBtn.disabled = true;
      authSubmitBtn.textContent = currentMode === "signup" ? "Registering..." : "Verifying...";

      // Mode A: Sign Up via supabase.auth.signUp()
      if (currentMode === "signup") {
        const displayName = nameInput?.value.trim() || email.split("@")[0];

        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email: email,
              password: password,
              options: {
                data: {
                  name: displayName
                }
              }
            });

            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Create account";

            if (error) {
              showToast("Registration Failed", error.message, "warning");
              return;
            }

            if (data && data.user) {
              // If email confirmation is required by Supabase settings:
              if (!data.session) {
                showToast("Account Created!", "Please check your email to confirm your account, then log in.", "success");
                setMode("login");
                return;
              }

              const user = formatUserData(data.user, displayName);
              localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
              showToast("Account Created!", `Welcome to EcoScan AI, ${displayName}!`, "success");
              if (typeof onAuthSuccess === "function") {
                onAuthSuccess(user);
              }
              return;
            }
          } catch (err) {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Create account";
            showToast("Signup Error", err.message || "Failed to create account.", "warning");
            return;
          }
        } else {
          // If keys are placeholder
          showToast("Supabase Notice", "Add your SUPABASE_URL & SUPABASE_ANON_KEY to .env or .env.local for live authentication.", "info");
          fallbackLocalAuth(email, displayName, true);
        }
      }
      // Mode B: Log In via supabase.auth.signInWithPassword()
      else {
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: email,
              password: password
            });

            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Log in";

            if (error) {
              // Strictly reject incorrect passwords or nonexistent users
              showToast("Authentication Failed", error.message || "Invalid login credentials.", "warning");
              return;
            }

            if (data && data.user) {
              const user = formatUserData(data.user);
              localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
              showToast("Welcome back!", `Logged into EcoScan AI Dashboard.`, "success");
              if (typeof onAuthSuccess === "function") {
                onAuthSuccess(user);
              }
              return;
            }
          } catch (err) {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = "Log in";
            showToast("Login Error", err.message || "Failed to log in with Supabase.", "warning");
            return;
          }
        } else {
          showToast("Supabase Notice", "Add your SUPABASE_URL & SUPABASE_ANON_KEY to .env or .env.local for live authentication.", "info");
          fallbackLocalAuth(email, "", false);
        }
      }
    });
  }

  // Graceful fallback for initial prototyping when placeholder credentials are still present
  function fallbackLocalAuth(email, name, isSignup) {
    let existingUser = null;
    try {
      existingUser = JSON.parse(localStorage.getItem("ecoscan_current_user") || "null");
    } catch {}

    const displayName = isSignup
      ? name || "Eco Member"
      : existingUser?.email === email && existingUser?.name
      ? existingUser.name
      : email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);

    const user = {
      id: existingUser?.id || "usr_" + Date.now(),
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

    localStorage.setItem("ecoscan_current_user", JSON.stringify(user));
    if (authSubmitBtn) {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isSignup ? "Create account" : "Log in";
    }

    showToast(isSignup ? "Account Created!" : `Welcome back, ${displayName}!`, "Logged into your EcoScan AI Dashboard.", "success");

    if (typeof onAuthSuccess === "function") {
      onAuthSuccess(user);
    }
  }

  attachSwitchListeners();
}
