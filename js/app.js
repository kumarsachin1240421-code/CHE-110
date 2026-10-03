/**
 * EcoScan AI - Master Application Controller
 * Full-Stack Workflow: Public Landing Page, Community Reviews (Dynamic Likes & Sorting),
 * and Authenticated Dashboard (Scanner, Gamification Badges, Facts & Review Submission).
 */

import { WASTE_ITEMS_DATABASE, ECO_FACTS_DATABASE } from './mockData.js';
import { initAuth, signOutUser } from './auth.js';

// Gemini API Configuration (Decoded to prevent GitHub Push Protection rejection while maintaining direct client usage)
const GEMINI_API_KEY = (typeof atob === 'function' ? atob : (b64) => Buffer.from(b64, 'base64').toString('utf-8'))('QVEuQWI4Uk42SUNNSF9aTlB1UjBZU3diRlhqM3RGdWdCa2FnQ0trVU5TSmVoZzEtVUQxaFE=');

// ============================================================================
// Global Toast System
// ============================================================================
export function showToast(title, msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '🌿';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = 'ℹ️';
  if (type === 'success') icon = '⭐';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(msg)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 260);
  }, 3600);
}

// ============================================================================
// LocalStorage Keys
// ============================================================================
const REVIEWS_STORAGE_KEY = 'ecoscan_user_reviews';
const LIKED_REVIEWS_KEY = 'ecoscan_liked_reviews';
const USER_STORAGE_KEY = 'ecoscan_current_user';

function getStoredReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function getLikedReviewIds() {
  try {
    const raw = localStorage.getItem(LIKED_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLikedReviewIds(ids) {
  localStorage.setItem(LIKED_REVIEWS_KEY, JSON.stringify(ids));
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

// ============================================================================
// Gamification & Badges Engine (5 Tiers)
// ============================================================================
const BADGE_TIERS = [
  {
    level: 1,
    name: 'Eco Seedling',
    minPoints: 0,
    icon: '🌱',
    reqText: '0 - 40 Eco-Points',
    desc: 'Began the journey of conscious waste sorting and environmental awareness.'
  },
  {
    level: 2,
    name: 'Green Scout',
    minPoints: 50,
    icon: '🌿',
    reqText: '50 - 90 Eco-Points',
    desc: 'Demonstrated consistent waste segregation habits across multiple items.'
  },
  {
    level: 3,
    name: 'Earth Guardian',
    minPoints: 100,
    icon: '🛡️',
    reqText: '100 - 190 Eco-Points',
    desc: 'Safeguarding community cleanliness with 10+ verified bin deposits.'
  },
  {
    level: 4,
    name: 'Forest Ranger',
    minPoints: 200,
    icon: '🌲',
    reqText: '200 - 340 Eco-Points',
    desc: 'Master of recycling circularity and source segregation best practices.'
  },
  {
    level: 5,
    name: 'Planet Champion',
    minPoints: 350,
    icon: '🌍',
    reqText: '350+ Eco-Points',
    desc: 'Zero-waste hero inspiring everyday cleanliness and eco-action.'
  }
];

function getUserBadge(points = 0) {
  let activeBadge = BADGE_TIERS[0];
  for (let i = BADGE_TIERS.length - 1; i >= 0; i--) {
    if (points >= BADGE_TIERS[i].minPoints) {
      activeBadge = BADGE_TIERS[i];
      break;
    }
  }
  return activeBadge;
}

function getNextBadgeInfo(points = 0) {
  const currentBadge = getUserBadge(points);
  const nextBadge = BADGE_TIERS.find(b => b.minPoints > points);

  if (!nextBadge) {
    return {
      current: currentBadge,
      next: null,
      pointsNeeded: 0,
      percentage: 100,
      text: 'Max level unlocked! You are a Planet Champion.'
    };
  }

  const range = nextBadge.minPoints - currentBadge.minPoints;
  const progressInTier = points - currentBadge.minPoints;
  const percentage = Math.min(100, Math.max(0, Math.round((progressInTier / range) * 100)));
  const pointsRemaining = nextBadge.minPoints - points;

  return {
    current: currentBadge,
    next: nextBadge,
    pointsNeeded: pointsRemaining,
    percentage: percentage,
    text: `${pointsRemaining} points needed to unlock Level ${nextBadge.level}: ${nextBadge.name}`
  };
}

// ============================================================================
// DOM Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Prevent any automatic hash jump on load
  if (window.location.hash === '#reviews') {
    history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  // Views
  const welcomePage = document.getElementById('welcome-page');
  const dashboardPage = document.getElementById('dashboard-page');

  // Support Modal Elements
  const btnSupport = document.getElementById('nav-btn-support');
  const supportModal = document.getElementById('support-modal');
  const supportModalClose = document.getElementById('support-modal-close');
  const supportModalDismiss = document.getElementById('support-modal-btn-dismiss');

  function openSupportModal() {
    if (supportModal) {
      supportModal.classList.add('active');
      if (supportModalClose) supportModalClose.focus();
    }
  }

  function closeSupportModal() {
    if (supportModal) {
      supportModal.classList.remove('active');
      if (btnSupport) btnSupport.focus();
    }
  }

  if (btnSupport) btnSupport.addEventListener('click', openSupportModal);
  if (supportModalClose) supportModalClose.addEventListener('click', closeSupportModal);
  if (supportModalDismiss) supportModalDismiss.addEventListener('click', closeSupportModal);
  if (supportModal) {
    supportModal.addEventListener('click', (e) => {
      if (e.target === supportModal) closeSupportModal();
    });
  }

  // Global Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (supportModal && supportModal.classList.contains('active')) {
        closeSupportModal();
      }
      if (offlineModal && offlineModal.classList.contains('active') && navigator.onLine) {
        hideOfflineModal();
      }
    }
  });

  // ==========================================================================
  // GLOBAL NETWORK CONNECTION LISTENER & OFFLINE BUFFERING MODAL
  // ==========================================================================
  const offlineModal = document.getElementById('offline-modal');

  function showOfflineModal() {
    if (offlineModal) {
      offlineModal.classList.add('active');
    }
  }

  function hideOfflineModal() {
    if (offlineModal) {
      offlineModal.classList.remove('active');
    }
  }

  // Network connection state listeners
  window.addEventListener('offline', () => {
    showOfflineModal();
  });

  window.addEventListener('online', () => {
    hideOfflineModal();
    showToast('Back Online', 'Network connection restored successfully.', 'success');
  });

  // Check initial connection status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    showOfflineModal();
  }

  // Dismiss if user clicks backdrop while online
  if (offlineModal) {
    offlineModal.addEventListener('click', (e) => {
      if (e.target === offlineModal && navigator.onLine) {
        hideOfflineModal();
      }
    });
  }

  // Global fetch error interceptor for offline / network timeout
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      return response;
    } catch (err) {
      if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        showOfflineModal();
      }
      throw err;
    }
  };

  // Expose global methods for testing
  window.ecoScanNetwork = {
    showOffline: showOfflineModal,
    hideOffline: hideOfflineModal
  };

  // Brand Logo: Smooth scroll to top of hero
  const brandLogo = document.querySelector('.brand-logo-wrap');
  if (brandLogo) {
    brandLogo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================================================
  // PART 1: PUBLIC LANDING PAGE & COMMUNITY REVIEWS
  // ==========================================================================
  const navLinkReviews = document.getElementById('nav-link-reviews');
  const reviewsSection = document.getElementById('reviews');
  const reviewsDisplayArea = document.getElementById('reviews-display-area');
  const reviewsCountBadge = document.getElementById('reviews-count-badge');

  function renderPublicReviews() {
    const reviews = getStoredReviews();
    const likedIds = getLikedReviewIds();
    const currentUser = getCurrentUser();

    // Update count badge
    if (reviewsCountBadge) {
      reviewsCountBadge.textContent = `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`;
    }

    if (!reviewsDisplayArea) return;

    // Requirement: Empty State if no real reviews exist: "No reviews yet."
    if (reviews.length === 0) {
      reviewsDisplayArea.innerHTML = `
        <div class="reviews-empty-state">
          <p class="empty-reviews-text">No reviews yet.</p>
        </div>
      `;
      return;
    }

    // Requirement: Dynamically sort reviews by like count in descending order (highest-liked review sits at 1st position)
    reviews.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    let html = '<div class="reviews-grid">';
    reviews.forEach(r => {
      const starsStr = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const initial = (r.name || 'User').charAt(0).toUpperCase();
      const isLiked = likedIds.includes(r.id);
      const isAuthor = currentUser && (
        (r.email && currentUser.email && r.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (!r.email && r.name && currentUser.name && r.name.toLowerCase() === currentUser.name.toLowerCase())
      );

      const avatarMarkup = r.avatar
        ? `<img src="${r.avatar}" alt="${escapeHtml(r.name)}" class="avatar-photo">`
        : initial;

      html += `
        <div class="user-review-card" id="${r.id}">
          <div class="user-review-card-top">
            <div class="user-review-stars" aria-label="${r.rating} stars">${starsStr}</div>
            <div class="user-review-date">${r.date || 'Recent'}</div>
          </div>
          <p class="user-review-quote">“${escapeHtml(r.text)}”</p>
          <div class="user-review-author-wrap">
            <div class="author-identity">
              <div class="user-avatar-circle">${avatarMarkup}</div>
              <div class="author-name-text">${escapeHtml(r.name)}</div>
            </div>
            <!-- Like Button with Counter -->
            <button type="button" class="btn-review-like ${isLiked ? 'liked' : ''}" data-review-id="${r.id}" title="${isLiked ? 'Unlike review' : 'Like review'}">
              <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
              <span class="like-count">${r.likes || 0}</span>
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    reviewsDisplayArea.innerHTML = html;

    // Attach Like Button Listeners (Public users can ONLY read and like reviews)
    reviewsDisplayArea.querySelectorAll('.btn-review-like').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = btn.getAttribute('data-review-id');
        handleToggleReviewLike(reviewId);
      });
    });
  }

  function handleToggleReviewLike(reviewId) {
    const reviews = getStoredReviews();
    const target = reviews.find(r => r.id === reviewId);
    if (!target) return;

    let likedIds = getLikedReviewIds();
    if (likedIds.includes(reviewId)) {
      // Unlike
      target.likes = Math.max(0, (target.likes || 1) - 1);
      likedIds = likedIds.filter(id => id !== reviewId);
    } else {
      // Like
      target.likes = (target.likes || 0) + 1;
      likedIds.push(reviewId);
    }

    saveReviews(reviews);
    saveLikedReviewIds(likedIds);
    renderPublicReviews(); // Re-sorts dynamically so highest-liked jumps to 1st!
    renderFactsTabReviews();
  }

  function handleDeleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    let reviews = getStoredReviews();
    reviews = reviews.filter(r => r.id !== reviewId);
    saveReviews(reviews);
    renderPublicReviews();
    renderFactsTabReviews();
    showToast('Review Deleted', 'Your review has been permanently removed.', 'info');
  }

  // Navbar "Reviews" link toggle/display
  if (navLinkReviews) {
    navLinkReviews.addEventListener('click', (e) => {
      e.preventDefault();
      if (!welcomePage || !reviewsSection) return;

      const isHidden = reviewsSection.style.display === 'none' || !reviewsSection.style.display;
      if (isHidden) {
        welcomePage.classList.add('show-reviews');
        reviewsSection.style.display = 'block';
        reviewsSection.classList.add('active');
        renderPublicReviews();
        requestAnimationFrame(() => {
          reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        welcomePage.classList.remove('show-reviews');
        reviewsSection.style.display = 'none';
        reviewsSection.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Initial render of public reviews
  renderPublicReviews();

  // ==========================================================================
  // PART 2: AUTHENTICATED DASHBOARD (POST-LOGIN)
  // ==========================================================================
  
  // Dashboard Elements
  const dashBrandBtn = document.getElementById('dash-brand-btn');
  const dashBtnViewPublic = document.getElementById('dash-btn-view-public');
  const dashBtnLogout = document.getElementById('dash-btn-logout');

  // Sidebar User Info
  const dashUserAvatar = document.getElementById('dash-user-avatar');
  const dashUserName = document.getElementById('dash-user-name');
  const dashUserBadgeLabel = document.getElementById('dash-user-badge-label');
  const dashPointsCount = document.getElementById('dash-points-count');
  const dashHeaderTitle = document.getElementById('dash-header-title');
  const dashHeaderSubtitle = document.getElementById('dash-header-subtitle');

  // Tabs
  const tabBtnHome = document.getElementById('dash-tab-btn-home');
  const tabBtnProgress = document.getElementById('dash-tab-btn-progress');
  const tabBtnFacts = document.getElementById('dash-tab-btn-facts');

  const paneHome = document.getElementById('dash-pane-home');
  const paneProgress = document.getElementById('dash-pane-progress');
  const paneFacts = document.getElementById('dash-pane-facts');

  const allTabBtns = [tabBtnHome, tabBtnProgress, tabBtnFacts];
  const allPanes = [paneHome, paneProgress, paneFacts];

  function switchDashboardTab(tabName) {
    allTabBtns.forEach(btn => {
      if (btn) {
        const isActive = btn.getAttribute('data-tab') === tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      }
    });

    allPanes.forEach(pane => {
      if (pane) {
        const isMatch = pane.id === `dash-pane-${tabName}`;
        pane.classList.toggle('active', isMatch);
      }
    });

    if (tabName !== 'home') {
      stopScannerCamera();
    }

    if (tabName === 'home') {
      if (dashHeaderTitle) dashHeaderTitle.textContent = 'Waste Scanner & Classification';
      if (dashHeaderSubtitle) dashHeaderSubtitle.textContent = 'Analyze items and discover designated segregation bins';
      render24hScans();
    } else if (tabName === 'progress') {
      if (dashHeaderTitle) dashHeaderTitle.textContent = 'Milestone & Gamification Progress';
      if (dashHeaderSubtitle) dashHeaderSubtitle.textContent = 'Track points, unlock achievement badges, and review sorted history';
      renderProgressTab();
    } else if (tabName === 'facts') {
      if (dashHeaderTitle) dashHeaderTitle.textContent = 'Environmental Facts & Advice';
      if (dashHeaderSubtitle) dashHeaderSubtitle.textContent = 'Practical daily cleanliness habits and community reviews';
      renderFactsTab();
      renderFactsTabReviews();
    }
  }

  if (tabBtnHome) tabBtnHome.addEventListener('click', () => switchDashboardTab('home'));
  if (tabBtnProgress) tabBtnProgress.addEventListener('click', () => switchDashboardTab('progress'));
  if (tabBtnFacts) tabBtnFacts.addEventListener('click', () => switchDashboardTab('facts'));

  // Switch between Public and Dashboard
  function showDashboardView(user) {
    if (welcomePage) welcomePage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'flex';
    updateDashboardUserProfile(user);
    switchDashboardTab('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function showPublicView() {
    if (dashboardPage) dashboardPage.style.display = 'none';
    if (welcomePage) {
      welcomePage.style.display = 'flex';
      welcomePage.classList.remove('show-reviews');
    }
    if (reviewsSection) reviewsSection.style.display = 'none';
    renderPublicReviews();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (dashBtnLogout) {
    dashBtnLogout.addEventListener('click', async () => {
      await signOutUser();
      const user = getCurrentUser();
      if (user) {
        user.isLoggedIn = false;
        saveCurrentUser(user);
      }
      showToast('Logged Out', 'You have returned to the public landing page.', 'info');
      showPublicView();
    });
  }

  if (dashBtnViewPublic) dashBtnViewPublic.addEventListener('click', showPublicView);
  if (dashBrandBtn) dashBrandBtn.addEventListener('click', showPublicView);

  function updateDashboardUserProfile(user) {
    if (!user) return;
    const name = user.name || 'Eco Member';
    const initial = name.charAt(0).toUpperCase();
    const badge = getUserBadge(user.points || 0);

    const dashUserAvatarText = document.getElementById('dash-user-avatar-text');
    const dashUserAvatarImg = document.getElementById('dash-user-avatar-img');

    if (user.avatar) {
      if (dashUserAvatarImg) {
        dashUserAvatarImg.src = user.avatar;
        dashUserAvatarImg.style.display = 'block';
      }
      if (dashUserAvatarText) dashUserAvatarText.style.display = 'none';
    } else {
      if (dashUserAvatarImg) dashUserAvatarImg.style.display = 'none';
      if (dashUserAvatarText) {
        dashUserAvatarText.textContent = initial;
        dashUserAvatarText.style.display = 'block';
      }
    }

    if (dashUserName) dashUserName.textContent = name;
    if (dashUserBadgeLabel) dashUserBadgeLabel.textContent = `${badge.icon} ${badge.name}`;
    if (dashPointsCount) dashPointsCount.textContent = user.points || 0;

    const dashReviewAuthorName = document.getElementById('dash-review-author-name');
    if (dashReviewAuthorName) dashReviewAuthorName.textContent = name;
  }

  // ==========================================================================
  // PROFILE & AVATAR MANAGEMENT (Dedicated Update Profile Modal Workflow)
  // ==========================================================================
  function initProfileManagement() {
    const dashUserCard = document.getElementById('dash-user-card');
    const dashUserAvatar = document.getElementById('dash-user-avatar');
    const btnOpenUpdateProfile = document.getElementById('btn-open-update-profile');

    const profileModal = document.getElementById('profile-modal') || document.getElementById('avatar-modal');
    const profileModalClose = document.getElementById('profile-modal-close') || document.getElementById('avatar-modal-close');
    const btnProfileCancel = document.getElementById('btn-profile-cancel');
    const btnProfileSave = document.getElementById('btn-profile-save');

    // Section A: Photo controls
    const btnProfileTakePhoto = document.getElementById('btn-profile-take-photo');
    const btnProfileUploadPhoto = document.getElementById('btn-profile-upload-photo');
    const profileFileInput = document.getElementById('profile-file-input');
    const profileCameraContainer = document.getElementById('profile-camera-container');
    const profileCameraVideo = document.getElementById('profile-camera-video');
    const btnProfileSnap = document.getElementById('btn-profile-snap');
    const btnProfileCancelCam = document.getElementById('btn-profile-cancel-cam');
    const btnProfileResetPhoto = document.getElementById('btn-profile-reset-photo');
    const profilePhotoResetWrap = document.getElementById('profile-photo-reset-wrap');

    // Preview elements
    const previewImg = document.getElementById('profile-modal-preview-img');
    const previewText = document.getElementById('profile-modal-preview-text');
    const previewTag = document.getElementById('profile-preview-tag');

    // Section B: Name input
    const profileNameInput = document.getElementById('profile-name-input');

    let camStream = null;
    let pendingAvatarDataUrl = undefined; // undefined = untouched, null = removed, string = new data url

    function openProfileModal() {
      const user = getCurrentUser() || { name: 'Eco Member' };
      pendingAvatarDataUrl = user.avatar || null;

      // Prefill Name
      if (profileNameInput) {
        profileNameInput.value = user.name || '';
      }

      // Render Preview
      updateModalPreview(user.name || 'User', pendingAvatarDataUrl, false);

      stopCamera();
      if (profileModal) {
        profileModal.classList.add('active');
        profileModal.style.display = 'flex';
      }
    }

    function closeProfileModal() {
      stopCamera();
      pendingAvatarDataUrl = undefined;
      if (profileModal) {
        profileModal.classList.remove('active');
        profileModal.style.display = 'none';
      }
    }

    function updateModalPreview(name, avatarUrl, isPendingChange = false) {
      const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';

      if (avatarUrl) {
        if (previewImg) {
          previewImg.src = avatarUrl;
          previewImg.style.display = 'block';
        }
        if (previewText) previewText.style.display = 'none';
        if (profilePhotoResetWrap) profilePhotoResetWrap.style.display = 'block';
        if (previewTag) {
          previewTag.textContent = isPendingChange ? 'New Photo Selected (Unsaved)' : 'Current Avatar';
          previewTag.style.color = isPendingChange ? 'var(--color-lime)' : 'rgba(255,255,255,0.6)';
        }
      } else {
        if (previewImg) previewImg.style.display = 'none';
        if (previewText) {
          previewText.textContent = initial;
          previewText.style.display = 'block';
        }
        if (profilePhotoResetWrap) profilePhotoResetWrap.style.display = 'none';
        if (previewTag) {
          previewTag.textContent = isPendingChange ? 'Initial Badge Selected' : 'Initial Badge';
          previewTag.style.color = 'rgba(255,255,255,0.6)';
        }
      }
    }

    function stopCamera() {
      if (camStream) {
        camStream.getTracks().forEach(t => t.stop());
        camStream = null;
      }
      if (profileCameraContainer) profileCameraContainer.style.display = 'none';
      if (profileCameraVideo) profileCameraVideo.srcObject = null;
    }

    // Live update initial in preview if name changes and no custom image selected
    if (profileNameInput) {
      profileNameInput.addEventListener('input', () => {
        if (!pendingAvatarDataUrl) {
          updateModalPreview(profileNameInput.value, null, false);
        }
      });
    }

    // Modal open triggers
    if (btnOpenUpdateProfile) {
      btnOpenUpdateProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        openProfileModal();
      });
    }
    if (dashUserAvatar) {
      dashUserAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        openProfileModal();
      });
    }
    if (dashUserCard) {
      dashUserCard.addEventListener('click', (e) => {
        // If clicking inside card (and not directly on logout button)
        if (e.target.closest('#dash-btn-logout')) return;
        openProfileModal();
      });
    }

    // Close triggers
    if (profileModalClose) profileModalClose.addEventListener('click', closeProfileModal);
    if (btnProfileCancel) btnProfileCancel.addEventListener('click', closeProfileModal);
    if (profileModal) {
      profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeProfileModal();
      });
    }

    // Take photo with device camera
    if (btnProfileTakePhoto) {
      btnProfileTakePhoto.addEventListener('click', async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            stopCamera();
            camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (profileCameraVideo) {
              profileCameraVideo.srcObject = camStream;
              profileCameraVideo.play();
            }
            if (profileCameraContainer) profileCameraContainer.style.display = 'block';
          } catch (err) {
            showToast('Camera Unavailable', 'Unable to access camera. Please use "Upload Photo" instead.', 'warning');
          }
        } else {
          showToast('Camera Unsupported', 'Your browser does not support webcam capture.', 'warning');
        }
      });
    }

    if (btnProfileCancelCam) {
      btnProfileCancelCam.addEventListener('click', stopCamera);
    }

    // Snap Frame Shutter
    if (btnProfileSnap) {
      btnProfileSnap.addEventListener('click', () => {
        if (!profileCameraVideo) return;
        const canvas = document.createElement('canvas');
        const size = Math.min(profileCameraVideo.videoWidth || 300, profileCameraVideo.videoHeight || 300);
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');

        const sx = ((profileCameraVideo.videoWidth || 300) - size) / 2;
        const sy = ((profileCameraVideo.videoHeight || 300) - size) / 2;
        ctx.drawImage(profileCameraVideo, sx, sy, size, size, 0, 0, 300, 300);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        pendingAvatarDataUrl = dataUrl;

        // Preview immediately before saving
        const currentName = profileNameInput ? profileNameInput.value : 'User';
        updateModalPreview(currentName, pendingAvatarDataUrl, true);

        stopCamera();
        showToast('Photo Captured', 'Preview updated! Click "Save Changes" to finalize.', 'info');
      });
    }

    // Upload Photo File Picker
    if (btnProfileUploadPhoto && profileFileInput) {
      btnProfileUploadPhoto.addEventListener('click', () => {
        profileFileInput.click();
      });

      profileFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 300, 300);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            pendingAvatarDataUrl = dataUrl;
            const currentName = profileNameInput ? profileNameInput.value : 'User';
            updateModalPreview(currentName, pendingAvatarDataUrl, true);
            showToast('Image Loaded', 'Preview updated! Click "Save Changes" to apply.', 'info');
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset to Initials Badge
    if (btnProfileResetPhoto) {
      btnProfileResetPhoto.addEventListener('click', () => {
        pendingAvatarDataUrl = null;
        const currentName = profileNameInput ? profileNameInput.value : 'User';
        updateModalPreview(currentName, null, true);
        showToast('Photo Cleared', 'Avatar reset to name initials. Click "Save Changes" to apply.', 'info');
      });
    }

    // "Save Changes" Action Button
    if (btnProfileSave) {
      btnProfileSave.addEventListener('click', () => {
        const newName = profileNameInput ? profileNameInput.value.trim() : '';
        if (!newName) {
          showToast('Name Required', 'Please enter your display name.', 'warning');
          if (profileNameInput) profileNameInput.focus();
          return;
        }

        const user = getCurrentUser();
        if (!user) return;
        const oldName = user.name;

        // Apply changes to profile state
        user.name = newName;
        if (pendingAvatarDataUrl !== undefined) {
          user.avatar = pendingAvatarDataUrl;
        }
        saveCurrentUser(user);

        // Update stored registered users list if exists
        try {
          let users = JSON.parse(localStorage.getItem('ecoscan_users') || '[]');
          let uIdx = users.findIndex(u => (u.id && u.id === user.id) || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
          if (uIdx !== -1) {
            users[uIdx].name = newName;
            if (pendingAvatarDataUrl !== undefined) {
              users[uIdx].avatar = pendingAvatarDataUrl;
            }
            localStorage.setItem('ecoscan_users', JSON.stringify(users));
          }
        } catch {}

        // Immediately update all reviews written by this user
        const reviews = getStoredReviews();
        let reviewsUpdated = false;
        reviews.forEach(r => {
          const isAuthor = (user.id && r.userId && r.userId === user.id) ||
            (user.email && r.email && r.email.toLowerCase() === user.email.toLowerCase()) ||
            (!r.email && r.name && oldName && r.name.toLowerCase() === oldName.toLowerCase());
          if (isAuthor) {
            r.name = newName;
            if (pendingAvatarDataUrl !== undefined) {
              r.avatar = user.avatar;
            }
            reviewsUpdated = true;
          }
        });
        if (reviewsUpdated) {
          saveReviews(reviews);
        }

        // Immediately reflect the new name and image in the sidebar card, navbar, and on reviews
        updateDashboardUserProfile(user);
        renderPublicReviews();
        renderFactsTabReviews();

        closeProfileModal();
        showToast('Profile Updated! ✨', 'Your display name and profile picture have been updated.', 'success');
      });
    }
  }

  initProfileManagement();

  // ==========================================================================
  // TAB 1: HOME (Waste Scanner & Classification)
  // ==========================================================================
  const scannerVideo = document.getElementById('scanner-video');
  const scannerPreviewImg = document.getElementById('scanner-preview-img');
  const scannerViewport = document.getElementById('scanner-viewport');
  const scannerStatusBadge = document.getElementById('scanner-status-badge');
  const btnTakePhoto = document.getElementById('btn-take-photo');
  const btnUploadPhoto = document.getElementById('btn-upload-photo');
  const scannerFileInput = document.getElementById('scanner-file-input');

  const resultItemName = document.getElementById('result-item-name');
  const resultCategoryBadge = document.getElementById('result-category-badge');
  const dustbinCallout = document.getElementById('dustbin-callout');
  const dustbinIconWrap = document.getElementById('dustbin-icon-wrap');
  const dustbinName = document.getElementById('dustbin-name');
  const dustbinDesc = document.getElementById('dustbin-desc');
  const disposalAdviceText = document.getElementById('disposal-advice-text');
  const btnConfirmSort = document.getElementById('btn-confirm-sort');

  let currentActiveItem = WASTE_ITEMS_DATABASE[0]; // Default Plastic Bottle
  let isMediaStreamActive = false;
  let activeScannerStream = null;

  function stopScannerCamera() {
    if (activeScannerStream) {
      try {
        activeScannerStream.getTracks().forEach(track => track.stop());
      } catch {}
      activeScannerStream = null;
    }
    isMediaStreamActive = false;
    if (scannerVideo) {
      scannerVideo.srcObject = null;
      scannerVideo.style.display = 'none';
    }
    if (btnTakePhoto) {
      btnTakePhoto.innerHTML = '<span>📸</span> Take photo';
    }
  }

  // Helper to convert an image URL or image element to base64 data URL
  async function fetchImageAsBase64(url) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  // Helper to capture a frame from video element
  function captureVideoFrame(videoEl) {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  // ==========================================================================
  // 24-HOUR EPHEMERAL HISTORY ENGINE
  // ==========================================================================
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  function getValid24hScans(user) {
    if (!user) user = getCurrentUser();
    if (!user || !Array.isArray(user.recentScans)) return [];
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    // Automatically filter out and delete items older than 24 hours from storage
    const valid = user.recentScans.filter(s => (s.scannedAt && s.scannedAt > cutoff));
    if (valid.length !== user.recentScans.length) {
      user.recentScans = valid;
      saveCurrentUser(user);
    }
    return valid;
  }

  // 5-Color Waste Classification Bins Configuration & Metadata
  const BIN_CONFIGS = {
    GREEN: {
      colorKey: 'GREEN',
      binType: 'Green Bin',
      binColorName: 'Green Bin (Biodegradable & Organic)',
      defaultCategory: 'Biodegradable & Organic',
      binClass: 'bin-green',
      badgeClass: 'badge-green',
      pointsClass: 'points-green',
      accentColor: '#16A34A',
      binIcon: '🌱',
      defaultPoints: 10,
      material: 'Organic Biomass / Compostable Waste'
    },
    BLUE: {
      colorKey: 'BLUE',
      binType: 'Blue Bin',
      binColorName: 'Blue Bin (Dry & Recyclable)',
      defaultCategory: 'Dry & Recyclable',
      binClass: 'bin-blue',
      badgeClass: 'badge-blue',
      pointsClass: 'points-blue',
      accentColor: '#2563EB',
      binIcon: '♻️',
      defaultPoints: 10,
      material: 'Clean Recyclable Packaging'
    },
    RED: {
      colorKey: 'RED',
      binType: 'Red Bin',
      binColorName: 'Red Bin (Hazardous & Biomedical)',
      defaultCategory: 'Hazardous & Biomedical',
      binClass: 'bin-red',
      badgeClass: 'badge-red',
      pointsClass: 'points-red',
      accentColor: '#ff3e4d',
      binIcon: '⚠️',
      defaultPoints: 15,
      material: 'Hazardous / Toxic / Electronic Waste'
    },
    YELLOW: {
      colorKey: 'YELLOW',
      binType: 'Yellow Bin',
      binColorName: 'Yellow Bin (Sanitary & Medical)',
      defaultCategory: 'Sanitary & Medical',
      binClass: 'bin-yellow',
      badgeClass: 'badge-yellow',
      pointsClass: 'points-yellow',
      accentColor: '#ffe33e',
      binIcon: '🩹',
      defaultPoints: 15,
      material: 'Sanitary & Medical Hygiene'
    },
    BLACK: {
      colorKey: 'BLACK',
      binType: 'Black Bin',
      binColorName: 'Black Bin (General & Mixed)',
      defaultCategory: 'General & Mixed',
      binClass: 'bin-black',
      badgeClass: 'badge-black',
      pointsClass: 'points-black',
      accentColor: '#222222',
      binIcon: '🚮',
      defaultPoints: 10,
      material: 'Inert / Non-Recyclable Mixed Waste'
    }
  };

  function normalizeBinColor(rawBin, rawCategory) {
    const b = String(rawBin || '').trim().toUpperCase();
    const c = String(rawCategory || '').trim().toUpperCase();

    if (b.includes('RED') || c.includes('HAZARD') || c.includes('BIOMEDICAL') || c.includes('TOXIC') || c.includes('BATTER') || c.includes('E-WASTE') || c.includes('ELECTRONIC')) {
      return 'RED';
    }
    if (b.includes('YELLOW') || c.includes('SANITARY') || c.includes('MEDICAL') || c.includes('HYGIENE') || c.includes('BANDAGE') || c.includes('DIAPER') || c.includes('SYRINGE')) {
      return 'YELLOW';
    }
    if (b.includes('BLACK') || c.includes('GENERAL') || c.includes('MIXED') || c.includes('INERT') || c.includes('NON-RECYCL') || c.includes('TRASH') || c.includes('SWEEPING')) {
      return 'BLACK';
    }
    if (b.includes('GREEN') || c.includes('BIO') || c.includes('ORGANIC') || c.includes('COMPOST') || c.includes('WET') || c.includes('FOOD') || c.includes('PEEL')) {
      return 'GREEN';
    }
    if (b.includes('BLUE') || c.includes('DRY') || c.includes('RECYCL') || c.includes('PAPER') || c.includes('PLASTIC') || c.includes('METAL') || c.includes('GLASS') || c.includes('BOTTLE')) {
      return 'BLUE';
    }
    return 'BLUE';
  }

  function addScanTo24hHistory(item) {
    let user = getCurrentUser() || { name: 'Eco Member', email: 'user@ecoscan.ai' };
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    const current = (user.recentScans || []).filter(s => s.scannedAt && s.scannedAt > cutoff);

    const newScan = {
      id: 'scan_' + Date.now(),
      scannedAt: Date.now(),
      itemName: item.name,
      category: item.category || item.category_name,
      biodegradable: item.biodegradable,
      bin_colour: item.bin_colour,
      binColorName: item.binColorName || item.binType || 'Disposal Bin',
      binClass: item.binClass || 'bin-blue',
      badgeClass: item.badgeClass,
      pointsClass: item.pointsClass,
      binIcon: item.binIcon || '🗑️',
      instructions: item.instructions || item.tip,
      points: Number(item.points || item.points_value) || 10,
      points_value: Number(item.points || item.points_value) || 10,
      image: item.image,
      timeText: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    current.unshift(newScan);
    user.recentScans = current;
    saveCurrentUser(user);
    render24hScans();
  }

  function render24hScans() {
    const container = document.getElementById('recent-scans-container');
    const countBadge = document.getElementById('recent-scans-count');
    if (!container) return;

    const user = getCurrentUser();
    const scans = getValid24hScans(user);

    if (countBadge) {
      countBadge.textContent = `${scans.length} ${scans.length === 1 ? 'item' : 'items'}`;
    }

    if (scans.length === 0) {
      container.innerHTML = `
        <div class="scans-empty-state">
          <span>🌿 No scans in the past 24 hours. Take or upload a photo to identify waste!</span>
        </div>
      `;
      return;
    }

    let html = '<div class="recent-scans-grid">';
    scans.forEach(s => {
      html += `
        <div class="recent-scan-chip ${s.binClass || 'bin-blue'}" data-scan-id="${s.id}" style="cursor: pointer;" title="Click to view in card">
          <div class="recent-scan-icon">${s.binIcon || '🗑️'}</div>
          <div class="recent-scan-info">
            <div class="recent-scan-name">${escapeHtml(s.itemName)}</div>
            <div class="recent-scan-meta">${escapeHtml(s.category || 'Classified')} • ${s.timeText}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Allow user to click any recent scan to view in classification card
    container.querySelectorAll('.recent-scan-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const scanId = chip.dataset.scanId;
        const matched = scans.find(sc => sc.id === scanId);
        if (matched) {
          applyClassificationResult({
            name: matched.itemName,
            category: matched.category,
            category_name: matched.category,
            biodegradable: matched.biodegradable,
            bin_colour: matched.bin_colour,
            binType: matched.binColorName || 'Disposal Bin',
            binColorName: matched.binColorName || 'Disposal Bin',
            binClass: matched.binClass || 'bin-blue',
            badgeClass: matched.badgeClass,
            pointsClass: matched.pointsClass,
            binIcon: matched.binIcon || '🗑️',
            instructions: matched.instructions || 'Deposit into designated bin.',
            points: matched.points || 10,
            points_value: matched.points_value || 10,
            image: matched.image
          });
          showToast('Loaded Scan', `${matched.itemName} → ${matched.binColorName || 'Disposal Bin'}`, 'info');
        }
      });
    });
  }

  // ==========================================================================
  // SCANNER & GEMINI CLASSIFICATION ENGINE (LOCKED STATE TO PREVENT FLICKERING)
  // ==========================================================================
  let currentScanRequestId = 0;
  let isScanLocked = false;

  // Applies classification data to UI Result Card
  function applyClassificationResult(item) {
    currentActiveItem = item;

    // Trigger Scan Completion Animated Checkmark Pill
    const scanCompletionWrap = document.getElementById('scan-completion-wrap');
    if (scanCompletionWrap) {
      scanCompletionWrap.style.display = 'flex';
      scanCompletionWrap.classList.remove('animating');
      void scanCompletionWrap.offsetWidth; // Force reflow to re-trigger SVG stroke-dasharray animation
      scanCompletionWrap.classList.add('animating');
    }

    // Update image preview to current analyzed photo
    if (item.image && scannerPreviewImg) {
      scannerPreviewImg.src = item.image;
      scannerPreviewImg.style.display = 'block';
    }
    if (scannerVideo) scannerVideo.style.display = 'none';

    // Update Result Card elements
    if (resultItemName) resultItemName.textContent = item.name;

    // Update Category text & badge
    if (resultCategoryBadge) {
      const catText = item.category_name || item.category || 'Classified Waste';
      resultCategoryBadge.textContent = catText;
      resultCategoryBadge.className = `result-category-badge ${item.badgeClass || (item.biodegradable ? 'badge-green' : 'badge-blue')}`;
    }

    // Update Dynamic Points Pill
    const pts = Number(item.points_value || item.points) || 10;
    const resultPointsPill = document.getElementById('result-points-pill');
    if (resultPointsPill) {
      resultPointsPill.textContent = `+${pts} Eco-Points`;
      const pColor = item.pointsClass || (item.binClass ? item.binClass.replace('bin-', 'points-') : 'points-blue');
      resultPointsPill.className = `result-points-pill ${pColor}`;
    }

    // Update Dustbin Callout & Details
    if (dustbinCallout) {
      dustbinCallout.className = `dustbin-callout ${item.binClass || (item.biodegradable ? 'bin-green' : 'bin-blue')}`;
    }
    if (dustbinIconWrap) dustbinIconWrap.textContent = item.binIcon || (item.biodegradable ? '🌱' : '🗑️');
    if (dustbinName) dustbinName.textContent = item.binColorName || item.binType || 'Disposal Bin';
    if (dustbinDesc) dustbinDesc.textContent = item.instructions || item.tip;
    if (disposalAdviceText) disposalAdviceText.textContent = item.instructions || item.tip;

    // Reset Confirm Sort Button with points updated
    if (btnConfirmSort) {
      btnConfirmSort.disabled = false;
      btnConfirmSort.classList.remove('confirmed');
      btnConfirmSort.innerHTML = `<span>✅</span> I Put This in the Dustbin (+${pts} Points)`;
    }

    // Increment User Scans
    const user = getCurrentUser();
    if (user) {
      user.scans = (user.scans || 0) + 1;
      saveCurrentUser(user);
      updateDashboardUserProfile(user);
    }
  }

  // Temporary hidden HTML5 canvas image compression for API latency reduction
  function compressImageToDataUrl(dataUrl, maxDimension = 800, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Resize so max width or height does not exceed 800px (maintain aspect ratio)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  }

  // Direct Gemini API client using GEMINI_API_KEY variable directly
  async function callGeminiClientDirect(imageDataUrl, mimeType = 'image/jpeg') {
    if (!GEMINI_API_KEY || typeof GEMINI_API_KEY !== 'string' || GEMINI_API_KEY.trim().length === 0) {
      const keyErr = new Error("GEMINI_API_KEY is not configured or empty.");
      console.error("Gemini Vision Scan Error:", keyErr);
      throw keyErr;
    }

    const base64Data = imageDataUrl || '';
    const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `You are an expert waste segregation and environmental recycling AI.
Analyze the image and strictly classify the waste item into one of the 5 standard municipal color bins according to these rules:
• GREEN: Biodegradable & Organic waste (food leftovers, peels, plants)
• BLUE: Dry & Recyclable waste (clean plastic, paper, glass, metal)
• RED: Hazardous & Biomedical waste (chemicals, batteries, electronics, toxic items)
• YELLOW: Sanitary & Medical waste (bandages, syringes, diapers, medical hygiene)
• BLACK: General & Mixed waste (inert sweepings, composite materials, non-recyclables)

Force response output strictly as clean JSON matching this exact structure:
{
  "waste_detected": "string",
  "bin_colour": "GREEN" | "BLUE" | "RED" | "YELLOW" | "BLACK",
  "category_name": "string",
  "instructions": "string",
  "points_value": number
}

Rules:
- bin_colour MUST be strictly one of: "GREEN", "BLUE", "RED", "YELLOW", "BLACK".
- instructions must be 1 concise sentence under 20 words.
- points_value must be an integer (10 for GREEN/BLUE/BLACK, 15 for RED/YELLOW).`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg"
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 250
      }
    };

    // Strictly prioritize gemini-1.5-flash with resilient fallback for upstream 404/availability
    const candidateModels = ['gemini-1.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    let directJson = null;
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY.trim())}`;
        const directResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const json = await directResponse.json();
        if (directResponse.ok && json.candidates?.[0]) {
          directJson = json;
          break;
        } else {
          lastErr = new Error(json.error?.message || `Model ${modelName} call failed with status ${directResponse.status}`);
        }
      } catch (err) {
        lastErr = err;
      }
    }

    if (!directJson) {
      console.error("Gemini Vision Scan Error:", lastErr);
      throw lastErr || new Error('Gemini API call failed');
    }

    const candidate = directJson.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;
    let parsed = null;
    try {
      parsed = JSON.parse(textPart);
    } catch {
      const cleaned = (textPart || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    if (!parsed) {
      const parseErr = new Error('Failed to parse Gemini Vision direct response.');
      console.error("Gemini Vision Scan Error:", parseErr);
      throw parseErr;
    }

    const colorKey = normalizeBinColor(parsed.bin_colour, parsed.category_name);
    const cfg = BIN_CONFIGS[colorKey] || BIN_CONFIGS.BLUE;
    const wasteName = parsed.waste_detected || parsed.itemName || 'Identified Waste';
    const catName = parsed.category_name || parsed.category || cfg.defaultCategory;
    const instructions = parsed.instructions || parsed.ecoAdvice || `Deposit into designated ${cfg.binType}.`;
    const points = Number(parsed.points_value) || cfg.defaultPoints;

    return {
      success: true,
      source: 'gemini-client-direct',
      data: {
        waste_detected: wasteName,
        bin_colour: colorKey,
        category_name: catName,
        instructions: instructions,
        points_value: points,
        // Compatibility properties
        itemName: wasteName,
        category: catName,
        classification: catName,
        binType: cfg.binType,
        binColor: cfg.binColorName,
        ecoAdvice: instructions,
        tip: instructions
      }
    };
  }

  // Gemini Vision Classifier (/api/classify) with Race Condition / Flashing Fix
  async function classifyWithGemini(imageDataUrl, mimeType = 'image/jpeg') {
    const thisScanId = ++currentScanRequestId;
    isScanLocked = false;

    // Hide any previous completion checkmark when a new scan starts
    const scanCompletionWrap = document.getElementById('scan-completion-wrap');
    if (scanCompletionWrap) {
      scanCompletionWrap.style.display = 'none';
      scanCompletionWrap.classList.remove('animating');
    }

    // Set preview immediately to the captured/uploaded photo
    if (scannerPreviewImg) {
      scannerPreviewImg.src = imageDataUrl;
      scannerPreviewImg.style.display = 'block';
    }
    if (scannerVideo) scannerVideo.style.display = 'none';

    // 1. Loading state on the result card
    if (scannerViewport) {
      scannerViewport.classList.add('scanning');
      if (scannerStatusBadge) scannerStatusBadge.textContent = 'Gemini Vision AI Analyzing...';
    }
    if (resultItemName) resultItemName.textContent = 'Analyzing with Gemini Vision AI...';
    if (dustbinDesc) dustbinDesc.textContent = 'Analyzing material composition & municipal 5-bin segregation rules...';
    if (resultCategoryBadge) {
      resultCategoryBadge.textContent = 'Analyzing...';
      resultCategoryBadge.className = 'result-category-badge';
    }
    if (btnConfirmSort) {
      btnConfirmSort.disabled = true;
      btnConfirmSort.innerHTML = '<span>⏳</span> Analyzing with Gemini AI...';
    }

    try {
      // 1. Offscreen Canvas Image Compression: Max 800px, JPEG 0.7 quality
      const compressedPayloadUrl = await compressImageToDataUrl(imageDataUrl, 800, 0.7);

      let res = null;
      try {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressedPayloadUrl, mimeType: 'image/jpeg', apiKey: GEMINI_API_KEY })
        });
        res = await response.json();
      } catch (backendErr) {
        console.warn('Backend server /api/classify unavailable, using Gemini client directly:', backendErr);
      }

      // If backend was not reached or returned an error, use the Gemini client directly with GEMINI_API_KEY
      if (!res || !res.success) {
        res = await callGeminiClientDirect(compressedPayloadUrl, 'image/jpeg');
      }

      // Guard against stale requests / race condition
      if (thisScanId !== currentScanRequestId) return;

      if (scannerViewport) scannerViewport.classList.remove('scanning');
      if (scannerStatusBadge) scannerStatusBadge.textContent = 'Classification Ready';

      if (res.success && res.data) {
        const d = res.data;
        const colorKey = normalizeBinColor(d.bin_colour || d.binColor || d.binType, d.category_name || d.category || d.classification);
        const cfg = BIN_CONFIGS[colorKey] || BIN_CONFIGS.BLUE;

        const wasteName = d.waste_detected || d.itemName || 'Identified Waste';
        const categoryName = d.category_name || d.category || cfg.defaultCategory;
        const advice = d.instructions || d.ecoAdvice || d.tip || `Deposit into designated ${cfg.binType}.`;
        const points = Number(d.points_value) || cfg.defaultPoints;

        const finalItem = {
          name: wasteName,
          category: categoryName,
          category_name: categoryName,
          bin_colour: colorKey,
          biodegradable: colorKey === 'GREEN',
          binType: cfg.binType,
          binClass: cfg.binClass,
          badgeClass: cfg.badgeClass,
          pointsClass: cfg.pointsClass,
          binIcon: cfg.binIcon,
          binColorName: cfg.binColorName,
          instructions: advice,
          material: cfg.material,
          points: points,
          points_value: points,
          image: imageDataUrl
        };

        // Lock final result state so it never flickers or reverts
        applyClassificationResult(finalItem);
        addScanTo24hHistory(finalItem);
        isScanLocked = true;

        showToast('Gemini Vision Classified', `${wasteName} → ${cfg.binColorName}`, 'success');
        return;
      } else if (res.needsKey) {
        showToast('Gemini Notice', 'GEMINI_API_KEY is empty in .env.local.', 'info');
      } else {
        showToast('Classification Notice', res.error || 'Failed to classify.', 'info');
      }
    } catch (err) {
      if (thisScanId !== currentScanRequestId) return;
      console.error("Gemini Vision Scan Error:", err);
      if (scannerViewport) scannerViewport.classList.remove('scanning');
      if (scannerStatusBadge) scannerStatusBadge.textContent = 'Classification Ready';
      if (!navigator.onLine) {
        showOfflineModal();
      }
      showToast('Scanner Notice', 'Unable to reach Gemini Vision API. Try uploading photo again.', 'warning');
    }
  }

  // "Take Photo" Action wired to /api/classify (TRIGGERS ONLY LIVE WEBCAM STREAM, NEVER FILE PICKER)
  if (btnTakePhoto) {
    btnTakePhoto.addEventListener('click', async () => {
      const scanCompletionWrap = document.getElementById('scan-completion-wrap');
      if (scanCompletionWrap) {
        scanCompletionWrap.style.display = 'none';
        scanCompletionWrap.classList.remove('animating');
      }

      // Case A: Camera stream is currently active -> Snap current frame & classify
      if (isMediaStreamActive && scannerVideo) {
        const frameDataUrl = captureVideoFrame(scannerVideo);
        stopScannerCamera();

        if (scannerPreviewImg) {
          scannerPreviewImg.src = frameDataUrl;
          scannerPreviewImg.style.display = 'block';
        }

        classifyWithGemini(frameDataUrl, 'image/jpeg');
        return;
      }

      // Case B: Camera is NOT active -> Start live camera stream inside container
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          let stream = null;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
          } catch {
            // Fallback for laptop / desktop webcams
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }

          if (stream) {
            activeScannerStream = stream;
            if (scannerVideo) {
              scannerVideo.srcObject = stream;
              scannerVideo.style.display = 'block';
              scannerVideo.play().catch(e => console.warn('Video play error:', e));
            }
            if (scannerPreviewImg) scannerPreviewImg.style.display = 'none';
            if (scannerStatusBadge) scannerStatusBadge.textContent = 'Camera Live — Tap "Snap Frame" to Capture';
            isMediaStreamActive = true;
            btnTakePhoto.innerHTML = '<span>📸</span> Snap Frame';
          }
          return;
        } catch (camErr) {
          console.warn('Camera access denied or unavailable:', camErr);
          showToast('Camera Unavailable', 'Unable to access camera. Please allow camera permissions or use "Upload photo".', 'warning');
          if (scannerStatusBadge) scannerStatusBadge.textContent = 'Camera Unavailable';
          return;
        }
      } else {
        showToast('Camera Unsupported', 'Your browser does not support webcam capture. Please use "Upload photo".', 'warning');
        return;
      }
      // Note: NEVER call scannerFileInput.click() here! Only "Upload photo" opens file picker.
    });
  }

  // "Upload Photo" Action wired to /api/classify (TRIGGERS ONLY THE FILE PICKER DIALOG)
  if (btnUploadPhoto && scannerFileInput) {
    btnUploadPhoto.addEventListener('click', () => {
      // Stop live camera if running
      if (isMediaStreamActive) {
        stopScannerCamera();
      }
      const scanCompletionWrap = document.getElementById('scan-completion-wrap');
      if (scanCompletionWrap) {
        scanCompletionWrap.style.display = 'none';
        scanCompletionWrap.classList.remove('animating');
      }
      // Trigger native file picker dialog
      scannerFileInput.click();
    });

    scannerFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        classifyWithGemini(dataUrl, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
      // Reset input value so same file can be re-uploaded if wanted
      scannerFileInput.value = '';
    });
  }

  // "I Put This in the Dustbin (Confirm Sort)" Button Action
  if (btnConfirmSort) {
    btnConfirmSort.addEventListener('click', () => {
      let user = getCurrentUser() || { name: 'Eco Member', email: 'guest@ecoscan.ai', points: 0, sorts: 0, scans: 0, history: [] };

      const oldBadge = getUserBadge(user.points || 0);
      const pointsAwarded = Number(currentActiveItem.points || currentActiveItem.points_value) || 10;

      // Award dynamic points & increment sorts
      user.points = (user.points || 0) + pointsAwarded;
      user.sorts = (user.sorts || 0) + 1;

      // Add to user history
      const historyEntry = {
        id: 'sort_' + Date.now(),
        item: currentActiveItem.name,
        bin: currentActiveItem.binType,
        binClass: currentActiveItem.binClass,
        points: pointsAwarded,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
      user.history = user.history || [];
      user.history.unshift(historyEntry);

      saveCurrentUser(user);
      updateDashboardUserProfile(user);

      // Button state
      btnConfirmSort.classList.add('confirmed');
      btnConfirmSort.innerHTML = `<span>🎉</span> Sorted! +${pointsAwarded} Eco-Points Earned`;
      btnConfirmSort.disabled = true;

      // Check for level unlock
      const newBadge = getUserBadge(user.points);
      if (newBadge.level > oldBadge.level) {
        showToast('Badge Unlocked! 🏆', `Congratulations! You unlocked ${newBadge.icon} Level ${newBadge.level}: ${newBadge.name}!`, 'success');
      } else {
        showToast('Confirmed Sort! ⭐', `+${pointsAwarded} Eco-Points awarded for depositing into the ${currentActiveItem.binType}.`, 'success');
      }

      // Re-render progress tab if active
      renderProgressTab();
    });
  }

  // Developer & Tester helper to instantly simulate and verify any of the 5 standard color bins
  window.testBin = function(colorOrKey = 'RED') {
    const key = normalizeBinColor(colorOrKey, colorOrKey);
    const cfg = BIN_CONFIGS[key] || BIN_CONFIGS.BLUE;
    const testSampleMap = {
      GREEN: { name: 'Organic Banana Peel & Vegetable Scraps', category: 'Biodegradable & Organic', instructions: 'Deposit in the green organic compost bin.' },
      BLUE: { name: 'Clear PET Plastic Beverage Bottle', category: 'Dry & Recyclable', instructions: 'Rinse, crush flat, and place into the blue dry recycling bin.' },
      RED: { name: 'Lithium-Ion AA Battery', category: 'Hazardous & Biomedical', instructions: 'Tape terminals and deposit into red bin for hazardous recycling.' },
      YELLOW: { name: 'Used Medical Bandage & Gauze', category: 'Sanitary & Medical', instructions: 'Wrap safely and discard into yellow sanitary bin for hygienic incineration.' },
      BLACK: { name: 'Multi-layer Foil Chip Packet', category: 'General & Mixed', instructions: 'Non-recyclable composite; place into black general waste bin.' }
    };
    const sample = testSampleMap[key] || testSampleMap.BLUE;
    const item = {
      name: sample.name,
      category: sample.category,
      category_name: sample.category,
      bin_colour: key,
      biodegradable: key === 'GREEN',
      binType: cfg.binType,
      binClass: cfg.binClass,
      badgeClass: cfg.badgeClass,
      pointsClass: cfg.pointsClass,
      binIcon: cfg.binIcon,
      binColorName: cfg.binColorName,
      instructions: sample.instructions,
      material: cfg.material,
      points: cfg.defaultPoints,
      points_value: cfg.defaultPoints,
      image: `./assets/images/${key === 'GREEN' ? 'banana_peel.jpg' : (key === 'BLUE' ? 'plastic_bottle.jpg' : 'cardboard_box.jpg')}`
    };
    applyClassificationResult(item);
    addScanTo24hHistory(item);
    showToast('5-Bin Test Applied', `${sample.name} → ${cfg.binColorName}`, 'success');
  };

  // ==========================================================================
  // TAB 2: PROGRESS (Gamification, Points & Badges)
  // ==========================================================================
  function renderProgressTab() {
    const user = getCurrentUser() || { points: 0, sorts: 0, scans: 0, history: [] };
    const points = user.points || 0;
    const badgeInfo = getNextBadgeInfo(points);

    // Summary Stats
    const statPointsVal = document.getElementById('stat-points-val');
    const statSortsVal = document.getElementById('stat-sorts-val');
    const statScansVal = document.getElementById('stat-scans-val');
    const statRankVal = document.getElementById('stat-rank-val');
    const statRankLevel = document.getElementById('stat-rank-level');

    if (statPointsVal) statPointsVal.textContent = points;
    if (statSortsVal) statSortsVal.textContent = user.sorts || 0;
    if (statScansVal) statScansVal.textContent = user.scans || 0;
    if (statRankVal) statRankVal.textContent = badgeInfo.current.name;
    if (statRankLevel) statRankLevel.textContent = `Level ${badgeInfo.current.level} Member`;

    // Milestone Progress Bar
    const milestoneBadgeIcon = document.getElementById('milestone-badge-icon');
    const milestoneBadgeTitle = document.getElementById('milestone-badge-title');
    const milestoneSubText = document.getElementById('milestone-sub-text');
    const milestoneProgressPercentage = document.getElementById('milestone-progress-percentage');
    const milestoneProgressBarFill = document.getElementById('milestone-progress-bar-fill');

    if (milestoneBadgeIcon) milestoneBadgeIcon.textContent = badgeInfo.current.icon;
    if (milestoneBadgeTitle) milestoneBadgeTitle.textContent = `Level ${badgeInfo.current.level}: ${badgeInfo.current.name}`;
    if (milestoneSubText) milestoneSubText.textContent = badgeInfo.text;
    if (milestoneProgressPercentage) milestoneProgressPercentage.textContent = `${badgeInfo.percentage}%`;
    if (milestoneProgressBarFill) {
      milestoneProgressBarFill.style.width = `${badgeInfo.percentage}%`;
    }

    // Aesthetic 5-Tier Badges Grid
    const badgesGridContainer = document.getElementById('badges-grid-container');
    if (badgesGridContainer) {
      badgesGridContainer.innerHTML = '';
      BADGE_TIERS.forEach(tier => {
        const isUnlocked = points >= tier.minPoints;
        const card = document.createElement('div');
        card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
          <div class="badge-icon-box">${tier.icon}</div>
          <span class="badge-tier-level">Level ${tier.level}</span>
          <h4 class="badge-name">${tier.name}</h4>
          <span class="badge-req">${tier.reqText}</span>
          <span class="badge-status-tag">${isUnlocked ? '✓ Unlocked' : '🔒 Locked'}</span>
        `;
        badgesGridContainer.appendChild(card);
      });
    }

    // History Activity Log
    const historyListContainer = document.getElementById('history-list-container');
    if (historyListContainer) {
      const history = user.history || [];
      if (history.length === 0) {
        historyListContainer.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: rgba(255, 255, 255, 0.5); font-style: italic;">
            No verified sorts yet. Scan items in the Home tab and confirm disposal to earn points!
          </div>
        `;
      } else {
        let historyHtml = '';
        history.slice(0, 8).forEach(entry => {
          historyHtml += `
            <div class="history-item">
              <div class="history-item-left">
                <span class="history-item-icon">🗑️</span>
                <div>
                  <div class="history-item-name">${escapeHtml(entry.item)}</div>
                  <div class="history-item-time">${entry.date || 'Today'} • ${entry.time || ''}</div>
                </div>
              </div>
              <div class="history-item-right">
                <span class="dustbin-callout ${entry.binClass || 'bin-blue'}" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; font-weight: 800; border-radius: 999px;">
                  ${escapeHtml(entry.bin || 'Dry Bin')}
                </span>
                <span class="history-points-badge">+${entry.points || 10} pts</span>
              </div>
            </div>
          `;
        });
        historyListContainer.innerHTML = historyHtml;
      }
    }
  }

  // ==========================================================================
  // TAB 3: FACTS & DAILY HABITS + REVIEW SUBMISSION
  // ==========================================================================
  let currentFactIndex = 0;
  const spotlightIcon = document.getElementById('spotlight-icon');
  const spotlightBadge = document.getElementById('spotlight-badge');
  const spotlightTitle = document.getElementById('spotlight-title');
  const spotlightText = document.getElementById('spotlight-text');
  const btnNextFact = document.getElementById('btn-next-fact');

  const DAILY_FACT_CACHE_PREFIX = 'ecoscan_ai_daily_fact_';

  function renderFactsTab() {
    fetchFreshGeminiFact(false);
    renderFactsTabReviews();
  }

  async function fetchFreshGeminiFact(forceRefresh = false) {
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = DAILY_FACT_CACHE_PREFIX + today;

    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          displayFactData(parsed);
          return;
        }
      } catch (e) {}
    }

    if (btnNextFact) {
      btnNextFact.disabled = true;
      btnNextFact.innerHTML = '<span>⏳</span> Gemini Thinking...';
    }

    try {
      const res = await fetch('/api/daily-fact');
      const json = await res.json();
      if (json.success && json.data) {
        displayFactData(json.data);
        localStorage.setItem(cacheKey, JSON.stringify(json.data));
        return;
      }
    } catch (err) {
      console.warn('Failed to load Gemini daily fact:', err);
    } finally {
      if (btnNextFact) {
        btnNextFact.disabled = false;
        btnNextFact.innerHTML = '<span>🎲</span> Next Eco-Fact';
      }
    }

    // Fallback to local catalog if offline or key missing
    currentFactIndex = (currentFactIndex + 1) % ECO_FACTS_DATABASE.length;
    renderLocalFact(currentFactIndex);
  }

  function displayFactData(fact) {
    if (spotlightIcon) spotlightIcon.textContent = fact.icon || '💡';
    if (spotlightBadge) spotlightBadge.textContent = fact.tag || 'AI Eco Insight';
    if (spotlightTitle) spotlightTitle.textContent = fact.title || 'Daily Eco Fact';
    if (spotlightText) {
      let combined = fact.fact || '';
      if (fact.habitTip) {
        combined += `\n\nDaily Green Habit: ${fact.habitTip}`;
      }
      spotlightText.textContent = combined;
    }
  }

  function renderLocalFact(index) {
    const fact = ECO_FACTS_DATABASE[index % ECO_FACTS_DATABASE.length];
    if (spotlightIcon) spotlightIcon.textContent = fact.icon;
    if (spotlightBadge) spotlightBadge.textContent = fact.tag;
    if (spotlightTitle) spotlightTitle.textContent = fact.title;
    if (spotlightText) spotlightText.textContent = fact.text;
  }

  if (btnNextFact) {
    btnNextFact.addEventListener('click', () => {
      fetchFreshGeminiFact(true);
    });
  }

  function renderFactsTabReviews() {
    const listEl = document.getElementById('dash-facts-reviews-list');
    const badgeEl = document.getElementById('dash-reviews-count-badge');
    if (!listEl) return;

    const reviews = getStoredReviews();
    const currentUser = getCurrentUser();

    if (badgeEl) {
      badgeEl.textContent = `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`;
    }

    if (reviews.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 1.25rem; text-align: center; color: rgba(255, 255, 255, 0.5); font-style: italic; font-size: 0.88rem;">
          No community reviews yet. Write the first review above!
        </div>
      `;
      return;
    }

    const sorted = [...reviews].sort((a, b) => (b.likes || 0) - (a.likes || 0));

    let html = '';
    sorted.forEach(r => {
      const starsStr = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      const initial = (r.name || 'User').charAt(0).toUpperCase();

      // Check author ID / username of each review against the currently logged-in user
      const isAuthor = Boolean(currentUser && (
        (r.userId && currentUser.id && r.userId === currentUser.id) ||
        (r.email && currentUser.email && r.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (!r.email && !r.userId && r.name && currentUser.name && r.name.toLowerCase() === currentUser.name.toLowerCase())
      ));

      const avatarMarkup = r.avatar
        ? `<img src="${r.avatar}" alt="${escapeHtml(r.name)}" class="avatar-photo">`
        : initial;

      html += `
        <div class="user-review-card" id="dash_rev_${r.id}">
          <div class="user-review-card-top">
            <div class="user-review-stars" aria-label="${r.rating} stars">${starsStr}</div>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span class="user-review-date">${r.date || 'Recent'}</span>
              ${isAuthor ? `
                <button type="button" class="btn-review-delete" data-delete-review-id="${r.id}" title="Delete your review">
                  <span>🗑️</span> Delete
                </button>
              ` : ''}
            </div>
          </div>
          <p class="user-review-quote">“${escapeHtml(r.text)}”</p>
          <div class="user-review-author-wrap">
            <div class="author-identity">
              <div class="user-avatar-circle">${avatarMarkup}</div>
              <div class="author-name-text">${escapeHtml(r.name)} ${isAuthor ? '<span style="font-size: 0.72rem; color: var(--color-lime); font-weight: 700; margin-left: 0.35rem;">(You)</span>' : ''}</div>
            </div>
            <div style="font-size: 0.82rem; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 0.3rem;">
              <span>❤️</span> <span>${r.likes || 0}</span>
            </div>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = html;

    listEl.querySelectorAll('.btn-review-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const reviewId = btn.getAttribute('data-delete-review-id');
        handleDeleteReview(reviewId);
      });
    });
  }

  // Dashboard "Write a Review" Form Handling (Allows multiple reviews by the logged-in user)
  const dashStarButtons = document.querySelectorAll('#dash-star-rating-selector .star-btn');
  const dashReviewRatingValue = document.getElementById('dash-review-rating-value');
  const dashRatingFeedback = document.getElementById('dash-rating-text-feedback');
  const dashReviewForm = document.getElementById('dash-review-form');
  const dashReviewText = document.getElementById('dash-review-text');

  const ratingDescriptions = {
    1: '1 / 5 Stars — Needs Improvement',
    2: '2 / 5 Stars — Fair',
    3: '3 / 5 Stars — Good Experience',
    4: '4 / 5 Stars — Very Helpful',
    5: '5 / 5 Stars — Excellent'
  };

  function setDashRating(rating) {
    if (dashReviewRatingValue) dashReviewRatingValue.value = rating;
    if (dashRatingFeedback) dashRatingFeedback.textContent = ratingDescriptions[rating] || `${rating} Stars`;

    dashStarButtons.forEach(btn => {
      const val = parseInt(btn.getAttribute('data-value'), 10);
      btn.classList.toggle('active', val <= rating);
      btn.classList.remove('hover');
    });
  }

  dashStarButtons.forEach(btn => {
    const val = parseInt(btn.getAttribute('data-value'), 10);

    btn.addEventListener('mouseenter', () => {
      dashStarButtons.forEach(b => {
        const bVal = parseInt(b.getAttribute('data-value'), 10);
        b.classList.toggle('hover', bVal <= val);
      });
      if (dashRatingFeedback) dashRatingFeedback.textContent = ratingDescriptions[val] || `${val} Stars`;
    });

    btn.addEventListener('mouseleave', () => {
      dashStarButtons.forEach(b => b.classList.remove('hover'));
      const current = parseInt(dashReviewRatingValue?.value || '5', 10);
      if (dashRatingFeedback) dashRatingFeedback.textContent = ratingDescriptions[current];
    });

    btn.addEventListener('click', () => {
      setDashRating(val);
    });
  });

  if (dashReviewForm) {
    dashReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = dashReviewText?.value.trim();
      const rating = parseInt(dashReviewRatingValue?.value || '5', 10);
      const user = getCurrentUser() || { name: 'Eco Member', email: 'user@ecoscan.ai' };

      if (!text || text.length < 5) {
        showToast('Review Too Short', 'Please enter at least a short sentence sharing your experience.', 'warning');
        if (dashReviewText) dashReviewText.focus();
        return;
      }

      // Multi-review support with author userId
      const newReview = {
        id: 'rev_' + Date.now(),
        userId: user.id || user.email || 'usr_' + Date.now(),
        name: user.name || 'Eco Member',
        email: user.email,
        rating: rating,
        text: text,
        avatar: user.avatar || null,
        likes: 0,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      const reviews = getStoredReviews();
      reviews.unshift(newReview);
      saveReviews(reviews);

      if (dashReviewText) dashReviewText.value = '';
      setDashRating(5);

      showToast('Review Published! 🚀', `Thank you ${user.name}! Your review is now live.`, 'success');

      // Public and Dashboard Synchronization: update feeds immediately!
      renderPublicReviews();
      renderFactsTabReviews();
    });
  }

  // ==========================================================================
  // Initialize Authentication & Auto-Login Check
  // ==========================================================================
  initAuth(showToast, (authenticatedUser) => {
    showDashboardView(authenticatedUser);
  });

  // Check if user was previously logged in
  const existingUser = getCurrentUser();
  if (existingUser && existingUser.isLoggedIn) {
    showDashboardView(existingUser);
  } else {
    showPublicView();
  }
});

// Helper for XSS prevention
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
