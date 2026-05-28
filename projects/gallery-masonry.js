(function(){
  function applyMasonry(grid) {
    const rowHeight = parseInt(getComputedStyle(grid).getPropertyValue('--gallery-row-height')) || 220;
    const colWidth = parseInt(getComputedStyle(grid).getPropertyValue('--gallery-column-width')) || 12;
    const gap = parseInt(getComputedStyle(grid).getPropertyValue('gap')) || 24;
    const items = Array.from(grid.querySelectorAll('.gallery-item'));

    items.forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;
      // ensure image is loaded to get natural sizes
      if (!img.naturalWidth) return img.onload = () => applyMasonry(grid);
      const aspect = img.naturalWidth / img.naturalHeight;
      const idealWidth = Math.round(aspect * rowHeight);
      // compute span: include gap in calculation roughly
      const span = Math.max(1, Math.round((idealWidth + gap) / (colWidth + gap)));
      item.style.gridColumnEnd = `span ${span}`;
      item.style.gridRowEnd = `span 1`;
    });
  }

  function refreshAll() {
    document.querySelectorAll('.gallery-grid').forEach(applyMasonry);
  }

  window.addEventListener('load', refreshAll);
  window.addEventListener('resize', debounce(refreshAll, 120));

  function debounce(fn, wait){
    let t;
    return function(){
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), wait);
    }
  }

  const navEntry = performance.getEntriesByType('navigation')[0];
  const isBackForward = navEntry?.type === 'back_forward';
  const isReturningFromHome = sessionStorage.getItem('returningToHome') === 'true';

  let loaderInterval = null;
  let loaderProgress = 0;

  const overlayLoader = document.getElementById('project-page-loader');

  function getProjectVinylSource() {
    const match = location.pathname.match(/(\d{2})/);
    if (match) {
      const id = match[1];
      return `../${id}_Vinyl.png`;
    }

    const heroImg = document.querySelector('.hero-image img');
    return heroImg?.getAttribute('src') || '';
  }

  function createProjectLoader() {
    if (document.getElementById('project-page-loader')) return;

    const loader = document.createElement('div');
    loader.id = 'project-page-loader';

    const vinylSource = getProjectVinylSource();
    const heroImg = document.querySelector('.hero-image img');

    loader.innerHTML = `
      <div class="project-loader-shell">
        <div class="project-loader-vinyl" aria-hidden="true">
          <img class="vinyl-image" src="${vinylSource}" alt="Loading vinyl record">
        </div>
        <div id="project-loader-percent">0%</div>
      </div>
    `;

    const loaderImage = loader.querySelector('.vinyl-image');
    if (loaderImage && heroImg) {
      loaderImage.onerror = () => {
        loaderImage.src = heroImg.getAttribute('src') || '';
      };
    }

    document.body.appendChild(loader);
    return loader;
  }

  function removeProjectLoader() {
    const loader = document.getElementById('project-page-loader');
    if (!loader) return;

    loader.classList.add('hidden');
    window.setTimeout(() => {
      loader.remove();
    }, 1000);
  }

  function finishProjectLoader() {
    const loader = document.getElementById('project-page-loader');
    const percentText = document.getElementById('project-loader-percent');

    if (loaderInterval) {
      clearInterval(loaderInterval);
      loaderInterval = null;
    }

    loaderProgress = 100;
    if (percentText) {
      percentText.textContent = '100%';
    }

    document.body.classList.remove('loading');
    removeProjectLoader();
  }

  function startProjectLoader() {
    createProjectLoader();
    document.body.classList.add('loading');

    const loader = document.getElementById('project-page-loader');
    const percentText = document.getElementById('project-loader-percent');

    loaderProgress = 0;
    if (percentText) {
      percentText.textContent = '0%';
    }

    loaderInterval = setInterval(() => {
      loaderProgress = Math.min(loaderProgress + 1, 98);

      if (percentText) {
        percentText.textContent = `${loaderProgress}%`;
      }
    }, 20);

    window.addEventListener('load', finishProjectLoader, { once: true });
  }

  if (isBackForward || isReturningFromHome) {
    sessionStorage.removeItem('returningToHome');
    document.body.classList.remove('loading');
    removeProjectLoader();
  } else {
    startProjectLoader();
  }

  window.addEventListener('pageshow', (event) => {
    const persisted = event.persisted;
    const currentNavEntry = performance.getEntriesByType('navigation')[0];
    const persistedBackForward = currentNavEntry?.type === 'back_forward';

    if (persisted || persistedBackForward) {
      finishProjectLoader();
    }
  });

  /* Inject a spinning vinyl on project pages using the hero image */
  function initVinyl(){
    if(!document.querySelector('.project-page')) return;
    const heroImg = document.querySelector('.hero-image img');
    if(!heroImg) return;

    // avoid creating multiple times
    if(document.querySelector('.project-vinyl')) return;

    const vinyl = document.createElement('div');
    vinyl.className = 'project-vinyl';

    // create inner image element to match main page structure
    const img = document.createElement('img');
    img.className = 'vinyl-image';
    vinyl.appendChild(img);

    // create tonearm element and append to body so it does NOT inherit vinyl transforms
    const tonearm = document.createElement('div');
    tonearm.className = 'project-tonearm';
    document.body.appendChild(tonearm);

    document.body.appendChild(vinyl);

    // Derive project id (e.g. "01") from filename and prefer project vinly asset
    const match = location.pathname.match(/(\d{2})/);
    let vinylSrc = '';
    if(match){
      const id = match[1];
      // project pages live in /projects/, vinyl assets are at root one level up
      vinylSrc = `../${id}_Vinyl.png`;
    }

    // fallback to hero image if project-specific vinyl isn't available (onerror will handle it)
    img.src = vinylSrc || heroImg.getAttribute('src') || '';
    img.onerror = () => { img.src = heroImg.getAttribute('src') || ''; };

    // set size larger by default; can be tweaked per-project by changing the variable
    vinyl.style.setProperty('--vinyl-size', '400px');

    // show the tonearm with a simple load animation
    requestAnimationFrame(() => tonearm.classList.add('tonearm-show'));

    let rafId = null;
    function updateRotation(){
      const rotation = window.scrollY * 0.18; // tweak speed here
      // include translateX(40%) so only 60% of the vinyl is visible
      vinyl.style.transform = `translateY(-50%) translateX(40%) rotate(${rotation}deg)`;
      rafId = null;
    }

    window.addEventListener('scroll', () => {
      if(rafId) return;
      rafId = requestAnimationFrame(updateRotation);
    }, {passive: true});

    // initial position
    requestAnimationFrame(updateRotation);
  }

  window.addEventListener('load', initVinyl);
  window.addEventListener('resize', initVinyl);

  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.body.classList.add('page-loaded');
    });
  });

})();


const returnBtn = document.querySelector('.back-btn');

if (returnBtn) {
  returnBtn.addEventListener('click', () => {
    sessionStorage.setItem('returningToHome', 'true');
  });
}