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
})();
