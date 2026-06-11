/* PFL × Liga Stavok Activation Strategy 2026 — Navigation logic */
(function () {
  const deck = document.getElementById('deck');
  const slides = Array.from(deck.querySelectorAll('.slide'));
  const navPrev = document.getElementById('navPrev');
  const navNext = document.getElementById('navNext');
  const curSlideEl = document.getElementById('curSlide');
  const progressFill = document.getElementById('progressFill');
  const sectionBtns = Array.from(document.querySelectorAll('.section-btn'));

  // Slide-number → top-nav-section index map
  const SECTION_RANGES = [
    { idx: 0, slides: [1] },
    { idx: 1, slides: [2, 3] },
    { idx: 2, slides: [4, 5, 6, 7] },
    { idx: 3, slides: [8, 9, 10] },
    { idx: 4, slides: [11, 12, 13] },
    { idx: 5, slides: [14] },
    { idx: 6, slides: [15] },
    { idx: 7, slides: [16] },
  ];

  const TOTAL_LOGICAL = 16;
  let currentIdx = 0;

  // === Russian events horizontal scroll ===
  const eventsTrack = document.getElementById('eventsTrack');
  let currentEventIdx = 0;
  let totalEvents = 0;
  if (eventsTrack) {
    totalEvents = eventsTrack.querySelectorAll('.event-card').length;
    eventsTrack.addEventListener(
      'scroll',
      () => {
        const w = eventsTrack.clientWidth;
        const newIdx = Math.round(eventsTrack.scrollLeft / w);
        if (newIdx !== currentEventIdx) {
          currentEventIdx = newIdx;
          updateEventUI();
          updateUI();
        }
      },
      { passive: true }
    );
  }

  function updateEventUI() {
    if (!eventsTrack) return;
    const dots = eventsTrack.querySelectorAll('.event-dot');
    dots.forEach((d) => {
      const cardIdx = parseInt(d.dataset.eventIdx, 10);
      d.classList.toggle('active', cardIdx === currentEventIdx);
    });
    const prevs = eventsTrack.querySelectorAll('.ev-prev');
    const nexts = eventsTrack.querySelectorAll('.ev-next');
    prevs.forEach((b) => (b.disabled = currentEventIdx === 0));
    nexts.forEach((b) => (b.disabled = currentEventIdx === totalEvents - 1));
  }

  function goToEvent(idx) {
    if (!eventsTrack) return;
    idx = Math.max(0, Math.min(totalEvents - 1, idx));
    eventsTrack.scrollTo({ left: idx * eventsTrack.clientWidth, behavior: 'smooth' });
  }

  if (eventsTrack) {
    eventsTrack.addEventListener('click', (e) => {
      const dot = e.target.closest('.event-dot');
      if (dot) {
        goToEvent(parseInt(dot.dataset.eventIdx, 10));
        return;
      }
      const prev = e.target.closest('.ev-prev');
      if (prev) {
        goToEvent(currentEventIdx - 1);
        return;
      }
      const next = e.target.closest('.ev-next');
      if (next) {
        goToEvent(currentEventIdx + 1);
        return;
      }
    });
  }

  // === Main deck navigation ===
  function getCurrentSlideIdx() {
    const w = deck.clientWidth;
    return Math.round(deck.scrollLeft / w);
  }

  function getLogicalSlideNumber(slideIdx) {
    const slide = slides[slideIdx];
    if (!slide) return 1;
    return parseInt(slide.dataset.slide || slideIdx + 1, 10);
  }

  function updateUI() {
    const idx = getCurrentSlideIdx();
    currentIdx = idx;
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    const logicalNum = getLogicalSlideNumber(idx);
    curSlideEl.textContent = String(logicalNum).padStart(2, '0');
    progressFill.style.width = (logicalNum / TOTAL_LOGICAL) * 100 + '%';

    let activeSection = 0;
    for (const r of SECTION_RANGES) {
      if (r.slides.includes(logicalNum)) {
        activeSection = r.idx;
        break;
      }
    }
    sectionBtns.forEach((b, i) => b.classList.toggle('active', i === activeSection));

    navPrev.disabled = idx === 0 && currentEventIdx === 0;
    navNext.disabled = idx === slides.length - 1;
  }

  function goTo(idx) {
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    deck.scrollTo({ left: idx * deck.clientWidth, behavior: 'smooth' });
  }

  // Instant jump for section-button navigation — no slide-by-slide scroll.
  // Disables snap + smooth-scroll during the jump so the browser commits the new
  // scrollLeft immediately instead of animating through intermediate snap points.
  function goToInstant(idx) {
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    const prevBehavior = deck.style.scrollBehavior;
    const prevSnapType = deck.style.scrollSnapType;
    deck.style.scrollBehavior = 'auto';
    deck.style.scrollSnapType = 'none';
    deck.scrollLeft = idx * deck.clientWidth;
    // Force a reflow so the position commits before snap is re-enabled
    void deck.offsetWidth;
    requestAnimationFrame(() => {
      deck.style.scrollSnapType = prevSnapType;
      deck.style.scrollBehavior = prevBehavior;
      updateUI();
    });
  }

  function goToEventInstant(idx) {
    if (!eventsTrack) return;
    idx = Math.max(0, Math.min(totalEvents - 1, idx));
    const prevBehavior = eventsTrack.style.scrollBehavior;
    const prevSnapType = eventsTrack.style.scrollSnapType;
    eventsTrack.style.scrollBehavior = 'auto';
    eventsTrack.style.scrollSnapType = 'none';
    eventsTrack.scrollLeft = idx * eventsTrack.clientWidth;
    void eventsTrack.offsetWidth;
    requestAnimationFrame(() => {
      eventsTrack.style.scrollSnapType = prevSnapType;
      eventsTrack.style.scrollBehavior = prevBehavior;
      currentEventIdx = idx;
      updateEventUI();
    });
  }

  deck.addEventListener(
    'scroll',
    () => {
      requestAnimationFrame(updateUI);
    },
    { passive: true }
  );

  navPrev.addEventListener('click', () => {
    const slide = slides[currentIdx];
    if (slide && slide.dataset.slideRange && currentEventIdx > 0) {
      goToEvent(currentEventIdx - 1);
    } else {
      goTo(currentIdx - 1);
    }
  });
  navNext.addEventListener('click', () => {
    const slide = slides[currentIdx];
    if (slide && slide.dataset.slideRange && currentEventIdx < totalEvents - 1) {
      goToEvent(currentEventIdx + 1);
    } else {
      goTo(currentIdx + 1);
    }
  });

  sectionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Skip buttons that aren't slide-targets (e.g. Terms Sheet modal trigger)
      if (!btn.dataset.target) return;
      const targetLogical = parseInt(btn.dataset.target, 10);
      let targetIdx = 0;
      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const range = s.dataset.slideRange;
        if (range) {
          const [start, end] = range.split('-').map(Number);
          if (targetLogical >= start && targetLogical <= end) {
            targetIdx = i;
            const evIdx = targetLogical - start;
            goToEventInstant(evIdx);
            goToInstant(targetIdx);
            return;
          }
        }
        if (parseInt(s.dataset.slide, 10) === targetLogical) {
          targetIdx = i;
          break;
        }
      }
      goToInstant(targetIdx);
    });
  });

  document.addEventListener('keydown', (e) => {
    // Defer to any open modal (events / terms / distribution) when one owns focus
    const eventsModal = document.getElementById('eventsModal');
    const termsModal = document.getElementById('termsModal');
    const distModals = document.querySelectorAll('.dist-modal');
    if (eventsModal && eventsModal.classList.contains('is-open')) return;
    if (termsModal && termsModal.classList.contains('is-open')) return;
    for (const m of distModals) {
      if (m.classList.contains('is-open')) return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      navNext.click();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      navPrev.click();
    } else if (e.key === 'Home') {
      goTo(0);
    } else if (e.key === 'End') {
      goTo(slides.length - 1);
    }
  });

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!e.target.closest('.deck') && !e.target.closest('.events-track')) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // === Events Modal (Russian Talent CTA) ===
  // Events are embedded directly in #eventsModalTrack as .em-card elements.
  // This sets up open/close, prev/next, dots, keyboard nav and click-to-close.
  (function setupEventsModal() {
    const modal = document.getElementById('eventsModal');
    if (!modal) return;
    const triggers = document.querySelectorAll('[data-open-events-modal]');
    const closers = modal.querySelectorAll('[data-close-events-modal]');
    const track = modal.querySelector('#eventsModalTrack');
    const dotsEl = modal.querySelector('#eventsModalDots');
    const prevBtn = modal.querySelector('.events-modal-nav.prev');
    const nextBtn = modal.querySelector('.events-modal-nav.next');
    const curEl = modal.querySelector('.events-modal-counter .cur');
    const totalEl = modal.querySelector('.events-modal-counter .total');

    const cards = track.querySelectorAll('.em-card');
    const total = cards.length;
    if (!total) return;
    if (totalEl) totalEl.textContent = total;

    // Build dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'em-dot';
      dot.setAttribute('aria-label', 'Event ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(dot);
    }
    const dots = dotsEl.querySelectorAll('.em-dot');

    let activeIdx = 0;
    function goTo(i) {
      activeIdx = Math.max(0, Math.min(total - 1, i));
      cards.forEach((c, ci) => c.classList.toggle('is-active', ci === activeIdx));
      dots.forEach((d, di) => d.classList.toggle('is-active', di === activeIdx));
      if (curEl) curEl.textContent = activeIdx + 1;
      if (prevBtn) prevBtn.disabled = activeIdx === 0;
      if (nextBtn) nextBtn.disabled = activeIdx === total - 1;
    }

    function openModal(startIdx) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('events-modal-open');
      goTo(typeof startIdx === 'number' ? startIdx : 0);
    }
    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('events-modal-open');
    }

    triggers.forEach(t => t.addEventListener('click', () => openModal(0)));
    closers.forEach(c => c.addEventListener('click', closeModal));
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(activeIdx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(activeIdx + 1));

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeModal(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(activeIdx + 1); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(activeIdx - 1); }
    });
  })();

  // === Terms Sheet Modal ===
  // Opens the terms sheet in an overlay; "Download PDF" triggers the browser's
  // print dialog with a print-specific stylesheet that re-renders the content
  // for paper. User picks "Save as PDF" in the print dialog.
  (function setupTermsModal() {
    const modal = document.getElementById('termsModal');
    if (!modal) return;
    const triggers = document.querySelectorAll('[data-open-terms-modal]');
    const closers = modal.querySelectorAll('[data-close-terms-modal]');
    const printBtn = modal.querySelector('[data-print-terms]');

    function openModal() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('terms-modal-open');
    }
    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('terms-modal-open');
    }
    function printTerms() {
      // The print stylesheet shows only #termsModal contents formatted for paper.
      // Most browsers default to "Save as PDF" in the print dialog destination.
      window.print();
    }

    triggers.forEach(t => t.addEventListener('click', openModal));
    closers.forEach(c => c.addEventListener('click', closeModal));
    if (printBtn) printBtn.addEventListener('click', printTerms);

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeModal(); }
    });
  })();

  // === Distribution & Reach Modals ===
  // Broadcast (slide 4) and Social (slide 8) — same shell pattern as terms.
  // Each trigger has data-open-dist-modal="<modalId>".
  (function setupDistModals() {
    const modals = document.querySelectorAll('.dist-modal');
    if (!modals.length) return;
    const triggers = document.querySelectorAll('[data-open-dist-modal]');

    function openDistModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('terms-modal-open');
    }
    function closeAllDist() {
      modals.forEach(m => {
        m.classList.remove('is-open');
        m.setAttribute('aria-hidden', 'true');
      });
      document.body.classList.remove('terms-modal-open');
    }

    triggers.forEach(t => {
      t.addEventListener('click', () => openDistModal(t.dataset.openDistModal));
    });
    modals.forEach(modal => {
      modal.querySelectorAll('[data-close-dist-modal]').forEach(c => {
        c.addEventListener('click', closeAllDist);
      });
      modal.querySelectorAll('[data-print-dist]').forEach(p => {
        p.addEventListener('click', () => window.print());
      });
    });

    document.addEventListener('keydown', (e) => {
      const anyOpen = Array.from(modals).some(m => m.classList.contains('is-open'));
      if (!anyOpen) return;
      if (e.key === 'Escape') { closeAllDist(); }
    });
  })();

  // Init
  updateUI();
  if (eventsTrack) updateEventUI();
})();
