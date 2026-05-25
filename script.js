const vinylCollection = document.querySelector('.vinyl-collection');
const vinylContainers = Array.from(document.querySelectorAll('.vinyl-container'));
const vinylCovers = Array.from(document.querySelectorAll('.vinyl-cover'));
const vinyls = Array.from(document.querySelectorAll('.vinyl'));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Calculate responsive spacing based on viewport size and aspect ratio
let itemSpacingX = 290;
let itemSpacingY = 140;

const calculateResponsiveSpacing = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const aspectRatio = viewportWidth / viewportHeight;
  
  // On portrait phones and small devices, use exact 45-degree spacing
  if (viewportWidth < 700 && aspectRatio <= 1.05) {
    const spacing = Math.max(viewportWidth * 0.27, 70);
    itemSpacingX = spacing;
    itemSpacingY = spacing;
  }
  // On tablets / larger devices, use medium spacing
  else if (viewportWidth < 900) {
    itemSpacingX = 220;
    itemSpacingY = 110;
  }
  // On desktop (>= 900px), use default spacing
  else {
    itemSpacingX = 290;
    itemSpacingY = 140;
  }
};

calculateResponsiveSpacing();

let activeIndex = 0;
const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let touchStartY = null;
let touchCurrentY = null;
let touchMoved = false;
let touchAccumulated = 0;
const touchThreshold = 8;
const touchStep = 0.35; // Increased for better responsiveness
let lastTouchedCover = null;
let touchHoverTimeout = null;

const clearTouchHover = () => {
  if (lastTouchedCover) {
    lastTouchedCover.classList.remove('touch-hover');
    lastTouchedCover = null;
  }
  if (touchHoverTimeout) {
    clearTimeout(touchHoverTimeout);
    touchHoverTimeout = null;
  }
};

const setTouchHover = (cover) => {
  clearTouchHover();
  cover.classList.add('touch-hover');
  lastTouchedCover = cover;
  touchHoverTimeout = setTimeout(clearTouchHover, 3000);
};

const animateVinylNavigation = (vinyl, targetUrl) => {
  if (!vinyl || !targetUrl || isNavigating) return;
  isNavigating = true;
  document.body.classList.add('transitioning');
  document.body.classList.add('dark-grey-background');

  const rect = vinyl.getBoundingClientRect();
  const image = vinyl.querySelector('.vinyl-image');
  const clone = document.createElement('div');
  clone.classList.add('vinyl-animate', 'fly-right');
  const squareSize = Math.max(rect.width, rect.height);
  clone.style.setProperty('--vinyl-width', `${squareSize}px`);
  clone.style.setProperty('--vinyl-height', `${squareSize}px`);

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const currentCenterX = rect.left + rect.width / 2;
  const currentCenterY = rect.top + rect.height / 2;
  const translateX = centerX - currentCenterX;
  const translateY = centerY - currentCenterY;

  clone.style.setProperty('--vinyl-translate-x', `${translateX}px`);
  clone.style.setProperty('--vinyl-translate-y', `${translateY}px`);

  const offsetX = (squareSize - rect.width) / 2;
  const offsetY = (squareSize - rect.height) / 2;
  clone.style.top = `${rect.top - offsetY}px`;
  clone.style.left = `${rect.left - offsetX}px`;
  clone.style.width = `${squareSize}px`;
  clone.style.height = `${squareSize}px`;
  clone.style.transform = 'none';
  clone.style.overflow = 'hidden';
  clone.style.borderRadius = '50%';

  if (image) {
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.alt || 'Vinyl record';
    img.className = 'vinyl-image';
    clone.appendChild(img);
  }

  document.body.appendChild(clone);
  vinyl.style.visibility = 'hidden';

  clone.addEventListener('animationend', () => {
    clone.classList.add('spin-slow');
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 1000);
  }, { once: true });
};

if (supportsTouch) {
  document.body.classList.add('touch-device');
}

const setContainerPositions = () => {
  vinylContainers.forEach((container, index) => {
    container.style.left = `${-index * itemSpacingX}px`;
    container.style.top = `${index * itemSpacingY}px`;
    container.style.zIndex = `${index + 1}`; // stack later containers in front
  });
};

const updateCollectionTransform = () => {
  vinylCollection.style.transform = `translate(-50%, -50%) translate(${activeIndex * itemSpacingX}px, ${-activeIndex * itemSpacingY}px)`;
};

setContainerPositions();
updateCollectionTransform();

window.addEventListener('touchstart', (event) => {
  if (event.touches.length !== 1) return;
  touchStartY = event.touches[0].clientY;
  touchCurrentY = touchStartY;
  touchMoved = false;
  if (autoScrollAnimationId) {
    cancelAnimationFrame(autoScrollAnimationId);
    autoScrollAnimationId = null;
    activeIndex = clamp(activeIndex, 0, vinylContainers.length - 1);
  }
}, { passive: false });

window.addEventListener('touchmove', (event) => {
  if (!supportsTouch || touchStartY === null || event.touches.length !== 1) return;
  const touchY = event.touches[0].clientY;
  const deltaY = touchY - touchCurrentY;
  if (Math.abs(deltaY) < 2) return;
  touchMoved = true;
  touchCurrentY = touchY;
  touchAccumulated += deltaY;

  // Prevent tiny micro-movements from triggering scroll changes
  if (Math.abs(touchAccumulated) < touchThreshold) return;

  event.preventDefault();
  vinylCollection.classList.add('scrolling');

  // Reverse the direction so swipe up moves collection forward
  const direction = touchAccumulated > 0 ? -1 : 1;
  activeIndex = clamp(activeIndex + direction * touchStep, 0, vinylContainers.length - 1);
  updateCollectionTransform();

  // Keep remaining motion for smoother interaction
  touchAccumulated = touchAccumulated > 0 ? touchAccumulated - touchThreshold : touchAccumulated + touchThreshold;
}, { passive: false });

window.addEventListener('touchend', () => {
  touchStartY = null;
  touchCurrentY = null;
  touchMoved = false;
  touchAccumulated = 0;
});

window.addEventListener('touchcancel', () => {
  touchStartY = null;
  touchCurrentY = null;
  touchMoved = false;
  touchAccumulated = 0;
});

// Auto-scroll animation on page load
let autoScrollAnimationId;
let autoScrollProgress = 0;
const autoScrollVinyls = () => {
  let startTime = performance.now();
  const duration = 1500; // Total animation duration in ms
  const maxScroll = vinylContainers.length - 2;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out animation for smooth deceleration
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    // Calculate smooth scroll position without rounding
    const scrollAmount = easeProgress * maxScroll;
    autoScrollProgress = scrollAmount;
    vinylCollection.style.transform = `translate(-50%, -50%) translate(${scrollAmount * itemSpacingX}px, ${-scrollAmount * itemSpacingY}px)`;
    
    if (progress < 1) {
      autoScrollAnimationId = requestAnimationFrame(animate);
    } else {
      // Snap to final position
      activeIndex = maxScroll;
      updateCollectionTransform();
    }
  };
  
  autoScrollAnimationId = requestAnimationFrame(animate);
};

// Start auto-scroll immediately with entrance animation
autoScrollVinyls();

// Handle window resize to recalculate spacing
window.addEventListener('resize', () => {
  calculateResponsiveSpacing();
  setContainerPositions();
  updateCollectionTransform();
});

let isScrolling = false;
const scrollStep = 0.5; // Smaller fraction per wheel event makes scroll less sensitive

window.addEventListener('wheel', (event) => {
  event.preventDefault();
  
  // Stop auto-scroll if user scrolls manually
  if (autoScrollAnimationId) {
    cancelAnimationFrame(autoScrollAnimationId);
    autoScrollAnimationId = null;
    activeIndex = clamp(autoScrollProgress, 0, vinylContainers.length - 1);
  }

  vinylCollection.classList.add('scrolling');
  const direction = event.deltaY > 0 ? -1 : 1;
  activeIndex = clamp(activeIndex + direction * scrollStep, 0, vinylContainers.length - 1);
  updateCollectionTransform();
}, { passive: false });

const aboutMeButton = document.getElementById('about-me-button');
const portfolioButton = document.getElementById('portfolio-button');
const contactButton = document.getElementById('contact-button');
const award1Button = document.querySelector('.award1-button');
const award2Button = document.querySelector('.award2-button');
const headerIcon = document.getElementById('header-icon');
const textBox = document.getElementById('text-box');
const aboutMeText = document.getElementById('about-me-text');
const contactOptions = document.getElementById('contact-options');

// Set the "SAM'S PORTFOLIO" button as initially active
portfolioButton.classList.add('active')


const resetView = () => {
    if (textBox) textBox.style.display = 'none';
    if (aboutMeText) aboutMeText.classList.remove('visible');
    if (contactOptions) contactOptions.style.display = 'none';
    if (headerIcon) headerIcon.classList.remove('animate');
};
const clearActiveButtons = () => {
    aboutMeButton.classList.remove('active');
    portfolioButton.classList.remove('active');
    contactButton.classList.remove('active');
};
aboutMeButton.addEventListener('click', () => {
    clearActiveButtons();
    aboutMeButton.classList.add('active');
    if (headerIcon) headerIcon.classList.add('animate');
    document.body.classList.add('dark-grey-background');
    if (textBox) textBox.style.display = 'block';
    if (aboutMeText) aboutMeText.classList.add('visible');
    if (contactOptions) contactOptions.style.display = 'none';
});
portfolioButton.addEventListener('click', () => {
    clearActiveButtons();
    portfolioButton.classList.add('active');
    document.body.classList.remove('dark-grey-background');
    resetView();
});
contactButton.addEventListener('click', () => {
    clearActiveButtons();
    contactButton.classList.add('active');
    document.body.classList.add('dark-grey-background');
    resetView();
    if (contactOptions) contactOptions.style.display = 'flex';
});
if (award1Button) {
  award1Button.addEventListener('click', () => {
    window.open('https://www.worldskills.sg/skills/all-champions/-/-/digital-construction/gold-award/', '_blank');
  });
}
if (award2Button) {
  award2Button.addEventListener('click', () => {
    window.open('https://seedaward.sg/dbcs-seed-award-winners/2025/', '_blank');
  });
}


let isNavigating = false;

const customCursorText = document.getElementById('custom-cursor-text');
let cursorTargetX = 0;
let cursorTargetY = 0;
let cursorCurrentX = 0;
let cursorCurrentY = 0;
let cursorAnimationFrame = null;

const easeCursor = () => {
  const ease = 0.16;
  cursorCurrentX += (cursorTargetX - cursorCurrentX) * ease;
  cursorCurrentY += (cursorTargetY - cursorCurrentY) * ease;
  customCursorText.style.left = `${cursorCurrentX}px`;
  customCursorText.style.top = `${cursorCurrentY}px`;
  cursorAnimationFrame = requestAnimationFrame(easeCursor);
};

const updateCursorTarget = (e) => {
  cursorTargetX = e.clientX + 10;
  cursorTargetY = e.clientY + 10;
  if (cursorAnimationFrame === null) {
    cursorAnimationFrame = requestAnimationFrame(easeCursor);
  }
};

vinylCovers.forEach((cover) => {
  cover.addEventListener('mouseenter', (e) => {
    const projectName = cover.dataset.projectName;
    if (projectName) {
      customCursorText.textContent = projectName;
      customCursorText.style.display = 'block';
      document.documentElement.style.cursor = 'none';
      cursorCurrentX = e.clientX + 10;
      cursorCurrentY = e.clientY + 10;
      updateCursorTarget(e);
    }
  });

  cover.addEventListener('mousemove', (e) => {
    updateCursorTarget(e);
  });

  cover.addEventListener('mouseleave', () => {
    customCursorText.style.display = 'none';
    document.documentElement.style.cursor = '';
    if (cursorAnimationFrame !== null) {
      cancelAnimationFrame(cursorAnimationFrame);
      cursorAnimationFrame = null;
    }
  });

  cover.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
      touchStartY = event.touches[0].clientY;
      touchCurrentY = touchStartY;
      touchMoved = false;
    }
  }, { passive: true });

  cover.addEventListener('touchend', (event) => {
    if (touchStartY === null) return;
    const touchEndY = event.changedTouches[0].clientY;
    if (Math.abs(touchEndY - touchStartY) > touchThreshold) {
      touchStartY = null;
      return;
    }

    const vinyl = cover.querySelector('.vinyl');
    const targetUrl = vinyl?.dataset.projectUrl;
    if (!targetUrl || isNavigating) {
      touchStartY = null;
      return;
    }

    if (cover.classList.contains('touch-hover')) {
      clearTouchHover();
      animateVinylNavigation(vinyl, targetUrl);
    } else {
      setTouchHover(cover);
    }
    touchStartY = null;
  });
});

document.addEventListener('touchstart', (event) => {
  if (!lastTouchedCover) return;
  if (!lastTouchedCover.contains(event.target)) {
    clearTouchHover();
  }
}, { passive: true });

vinyls.forEach((vinyl) => {
  vinyl.addEventListener('click', () => {
    if (isNavigating) return;
    const targetUrl = vinyl.dataset.projectUrl || 'project.html';
    isNavigating = true;
    document.body.classList.add('transitioning');
    document.body.classList.add('dark-grey-background');

    const rect = vinyl.getBoundingClientRect();
    const image = vinyl.querySelector('.vinyl-image');
    const clone = document.createElement('div');
    clone.classList.add('vinyl-animate', 'fly-right');
    const squareSize = Math.max(rect.width, rect.height);
    clone.style.setProperty('--vinyl-width', `${squareSize}px`);
    clone.style.setProperty('--vinyl-height', `${squareSize}px`);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const currentCenterX = rect.left + rect.width / 2;
    const currentCenterY = rect.top + rect.height / 2;
    const translateX = centerX - currentCenterX;
    const translateY = centerY - currentCenterY;

    clone.style.setProperty('--vinyl-translate-x', `${translateX}px`);
    clone.style.setProperty('--vinyl-translate-y', `${translateY}px`);

    const offsetX = (squareSize - rect.width) / 2;
    const offsetY = (squareSize - rect.height) / 2;
    clone.style.top = `${rect.top - offsetY}px`;
    clone.style.left = `${rect.left - offsetX}px`;
    clone.style.width = `${squareSize}px`;
    clone.style.height = `${squareSize}px`;
    clone.style.transform = 'none';
    clone.style.overflow = 'hidden';
    clone.style.borderRadius = '50%';

    if (image) {
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt || 'Vinyl record';
      img.className = 'vinyl-image';
      clone.appendChild(img);
    }

    document.body.appendChild(clone);

    vinyl.style.visibility = 'hidden';

    clone.addEventListener('animationend', () => {
      clone.classList.add('spin-slow');
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1000);
    }, { once: true });
  });
});

// Detect browser history navigation
window.addEventListener("popstate", () => {
    location.reload();
});

// Detect mouse back button
window.addEventListener("mouseup", (event) => {
    if (event.button === 3) {
        event.preventDefault();
        location.reload();
    }
});