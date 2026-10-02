/**
 * EcoScan AI - Master Application Controller
 * Smooth scroll, Support modal, Indian sample reviews, and Right-Downside FAQ widget.
 */

import { DEMO_REVIEWS, FAQ_DATA } from './mockData.js';
import { initAuth } from './auth.js';

// Global Toast System
export function showToast(title, msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '🌿';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${msg}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 260);
  }, 3600);
}

document.addEventListener('DOMContentLoaded', () => {
  // Prevent any automatic hash scroll jump on initial load
  if (window.location.hash === '#reviews') {
    history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

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

  // Reviews Nav Link: Smooth Scroll Down
  const navLinkReviews = document.getElementById('nav-link-reviews');
  if (navLinkReviews) {
    navLinkReviews.addEventListener('click', (e) => {
      e.preventDefault();
      const reviewsSection = document.getElementById('reviews');
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Right Downside FAQ Widget
  const btnFaqToggle = document.getElementById('btn-faq-toggle');
  const faqDrawer = document.getElementById('faq-drawer');
  const faqDrawerClose = document.getElementById('faq-drawer-close');
  const faqListContainer = document.getElementById('faq-list-container');

  function toggleFaqDrawer() {
    if (faqDrawer) {
      faqDrawer.classList.toggle('active');
    }
  }

  function closeFaqDrawer() {
    if (faqDrawer) {
      faqDrawer.classList.remove('active');
    }
  }

  if (btnFaqToggle) btnFaqToggle.addEventListener('click', toggleFaqDrawer);
  if (faqDrawerClose) faqDrawerClose.addEventListener('click', closeFaqDrawer);

  // Populate FAQ list with accordion behavior
  if (faqListContainer) {
    faqListContainer.innerHTML = '';
    FAQ_DATA.forEach((faq, index) => {
      const item = document.createElement('div');
      item.className = `faq-item ${index === 0 ? 'open' : ''}`;
      item.innerHTML = `
        <button type="button" class="faq-question-btn" aria-expanded="${index === 0}">
          <span>${faq.question}</span>
          <span class="faq-chevron">▼</span>
        </button>
        <div class="faq-answer">
          ${faq.answer}
        </div>
      `;

      const btn = item.querySelector('.faq-question-btn');
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close siblings
        faqListContainer.querySelectorAll('.faq-item').forEach(other => other.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });

      faqListContainer.appendChild(item);
    });
  }

  // Global Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (supportModal && supportModal.classList.contains('active')) {
        closeSupportModal();
      }
      if (faqDrawer && faqDrawer.classList.contains('active')) {
        closeFaqDrawer();
      }
    }
  });

  // Initialize Indian Sample Reviews Carousel
  initReviewsCarousel();

  // Initialize Auth Controller
  initAuth(showToast);
});

// Reviews Carousel Controller
function initReviewsCarousel() {
  const track = document.getElementById('reviews-track');
  const prevBtn = document.getElementById('reviews-prev-btn');
  const nextBtn = document.getElementById('reviews-next-btn');
  if (!track) return;

  track.innerHTML = '';
  DEMO_REVIEWS.forEach(r => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-card-top">
        <div class="review-stars">${r.stars}</div>
        <div class="review-location-tag">${r.city}</div>
      </div>
      <p class="review-quote">“${r.text}”</p>
      <div class="review-author-wrap">
        <div class="review-avatar-badge">${r.avatar}</div>
        <div>
          <div class="review-author-name">${r.author}</div>
          <div class="review-author-role">${r.role}</div>
        </div>
      </div>
    `;
    track.appendChild(card);
  });

  let currentIndex = 0;
  const cards = () => track.querySelectorAll('.review-card');

  function updateTrack() {
    const cardList = cards();
    if (cardList.length === 0) return;
    const cardWidth = cardList[0].offsetWidth + 24; // width + gap
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      updateTrack();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth <= 1180;
      const maxIndex = isMobile 
        ? DEMO_REVIEWS.length - 1 
        : (isTablet ? DEMO_REVIEWS.length - 2 : Math.max(0, DEMO_REVIEWS.length - 3));
      currentIndex = Math.min(maxIndex, currentIndex + 1);
      updateTrack();
    });
  }

  // Touch Swipe for Mobile
  let startX = 0;
  let endX = 0;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next
        const maxIndex = DEMO_REVIEWS.length - 1;
        currentIndex = Math.min(maxIndex, currentIndex + 1);
      } else {
        // swipe right -> prev
        currentIndex = Math.max(0, currentIndex - 1);
      }
      updateTrack();
    }
  }, { passive: true });

  window.addEventListener('resize', updateTrack);
}
