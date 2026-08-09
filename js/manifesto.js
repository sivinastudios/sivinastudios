(() => {
  const root = document.documentElement;
  const canvas = document.getElementById('sceneCanvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const doc = document.getElementById('manifestoDocument');
  const viewport = document.getElementById('documentViewport');
  const chapters = [...document.querySelectorAll('.chapter')];
  const chapterNumber = document.getElementById('chapterNumber');
  const progressLabel = document.getElementById('progressLabel');
  const scrollCue = document.querySelector('.scroll-cue');
  const sound = document.getElementById('soundToggle');
  const audio = document.getElementById('houseAmbience');

  const paths = {
    reality: 'assets/manifesto/states/reality.png',
    sketch: 'assets/manifesto/states/sketch.png',
    watercolor: 'assets/manifesto/states/watercolor.png'
  };

  const images = {};
  let knowing = 0;
  let docCurrent = 0;
  let soundOn = false;
  let cover = { x: 0, y: 0, w: 0, h: 0 };
  let flyingWords = [];
  let renderQueued = false;

  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function resizeCanvas() {
    // A DPR cap of 1.35 keeps the scene crisp while avoiding the 4x pixel cost
    // that was causing scroll stalls on high-DPI phones and Chromebooks.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    canvas.width = Math.max(1, Math.round(innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(innerHeight * dpr));
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;

    const imageRatio = 1536 / 1024;
    const viewportRatio = canvas.width / canvas.height;
    const portraitMobile = innerWidth <= 900 && innerHeight > innerWidth;
    let dw, dh;

    if (portraitMobile) {
      dw = canvas.width * 0.98;
      dh = dw / imageRatio;
    } else if (viewportRatio > imageRatio) {
      dw = canvas.width;
      dh = dw / imageRatio;
    } else {
      dh = canvas.height;
      dw = dh * imageRatio;
    }

    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    cover = { x: dx, y: dy, w: dw, h: dh };

    const sx = dx + dw * (156 / 1536);
    const sy = dy + dh * (81 / 1024);
    const sw = dw * (1225 / 1536);
    const sh = dh * (778 / 1024);
    root.style.setProperty('--screen-left', `${sx / dpr}px`);
    root.style.setProperty('--screen-top', `${sy / dpr}px`);
    root.style.setProperty('--screen-width', `${sw / dpr}px`);
    root.style.setProperty('--screen-height', `${sh / dpr}px`);
  }

  function drawImage(alpha, img) {
    if (alpha <= 0 || !img) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, cover.x, cover.y, cover.w, cover.h);
    ctx.restore();
  }

  function drawScene() {
    if (!images.reality) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#171316';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Same story as the original transformation, but rendered as three cheap,
    // scroll-locked washes instead of hundreds of procedural masks every frame.
    // 0–20% reality, 20–75% sketch emerging, 60–100% watercolor completing it.
    const realityAlpha = 1 - smoothstep(.20, .78, knowing);
    const sketchIn = smoothstep(.20, .56, knowing);
    const sketchOut = 1 - smoothstep(.70, 1.00, knowing);
    const sketchAlpha = Math.min(1, sketchIn * 1.08) * sketchOut;
    const watercolorAlpha = smoothstep(.60, 1.00, knowing);

    drawImage(realityAlpha, images.reality);
    drawImage(sketchAlpha, images.sketch);
    drawImage(watercolorAlpha, images.watercolor);

    // Keep a faint paper-light presence without a continuous animation loop.
    ctx.save();
    ctx.globalAlpha = .028 + knowing * .012;
    ctx.fillStyle = '#f6e9dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function updateScrollState() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = clamp(scrollY / max);

    // Critical flow fix: the text and background now follow the user's scroll
    // directly. The old code intentionally lagged both values, which felt like
    // the page stopping while the background caught up.
    knowing = progress;
    const docMax = Math.max(0, doc.scrollHeight - viewport.clientHeight);
    docCurrent = progress * docMax;

    root.style.setProperty('--knowing', knowing.toFixed(4));
    doc.style.transform = `translate3d(0,${-docCurrent}px,0)`;
    progressLabel.textContent = `KNOWING ${String(Math.round(knowing * 100)).padStart(2, '0')}`;
    scrollCue.style.opacity = progress > .035 ? '0' : '1';
  }

  function selectChapter() {
    const center = docCurrent + viewport.clientHeight * .44;
    let active = 0;
    chapters.forEach((chapter, i) => {
      if (center >= chapter.offsetTop) active = i;
      chapter.classList.toggle('is-visible', i === active || Math.abs(i - active) === 1);
    });
    chapterNumber.textContent = String(active + 1).padStart(2, '0');
  }

  function enlivenText() {
    // Keep the living-text idea at word level. The previous version created a
    // separate animated DOM node for virtually every character on the page,
    // which was expensive even on desktop and especially costly on mobile.
    const candidates = [...document.querySelectorAll('.chapter h1, .chapter h2, .chapter p')];
    candidates.forEach((el, elementIndex) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach((node, nodeIndex) => {
        const frag = document.createDocumentFragment();
        const tokens = node.nodeValue.match(/\s+|[^\s]+/g) || [];
        tokens.forEach((token, tokenIndex) => {
          if (/^\s+$/.test(token)) { frag.append(token); return; }
          const word = document.createElement('span');
          word.className = 'living-word-unit';
          word.textContent = token;
          const n = (elementIndex * 19 + nodeIndex * 13 + tokenIndex * 7) % 53;
          if (n === 3) word.classList.add('is-breathing');
          if (n === 17) word.classList.add('is-flickering');
          if (n === 31) word.classList.add('is-shifting');
          word.style.animationDelay = `${((elementIndex * 3 + tokenIndex) % 17) * -.61}s`;
          frag.append(word);
        });
        node.replaceWith(frag);
      });
    });
  }

  function prepareFlyingWords() {
    const rand = seededRandom(928374);
    const words = [...document.querySelectorAll('.living-word-unit')].filter(word => {
      const clean = word.textContent.replace(/[^a-zA-Z]/g, '');
      return clean.length >= 4;
    });
    const chosen = [];
    const desired = Math.min(innerWidth <= 900 ? 10 : 14, Math.max(8, Math.floor(words.length / 42)));
    for (let i = 0; i < words.length && chosen.length < desired; i++) {
      if (rand() < .035) chosen.push(words[i]);
    }
    for (let i = 0; chosen.length < desired && i < words.length; i += Math.max(1, Math.floor(words.length / desired))) {
      if (!chosen.includes(words[i])) chosen.push(words[i]);
    }

    flyingWords = chosen.slice(0, desired).map((source, index, arr) => {
      source.classList.add('trigger-word');
      const clone = source.cloneNode(true);
      clone.className = 'flying-word';
      clone.style.display = 'none';
      document.body.appendChild(clone);
      const base = arr.length === 1 ? .5 : index / (arr.length - 1);
      return {
        source, clone, started: false,
        trigger: .20 + base * .58 + (rand() - .5) * .018,
        duration: .14 + rand() * .045,
        dx: (rand() < .5 ? -1 : 1) * innerWidth * (.58 + rand() * .32),
        rise: innerHeight * (1.08 + rand() * .38),
        sway: 18 + rand() * 38,
        spin: (rand() - .5) * 20,
        seed: rand() * Math.PI * 2,
        width: 0, startX: 0, startY: 0
      };
    }).sort((a, b) => a.trigger - b.trigger);
  }

  function updateFlyingWords() {
    if (!flyingWords.length) return;
    flyingWords.forEach(item => {
      const local = clamp((knowing - item.trigger) / item.duration);
      if (local <= 0) return;

      if (!item.started) {
        const rect = item.source.getBoundingClientRect();
        item.startX = rect.left + rect.width / 2;
        item.startY = rect.top + rect.height / 2;
        item.width = rect.width;
        item.source.style.width = `${rect.width}px`;
        item.source.classList.add('is-departing');
        item.clone.style.display = 'block';
        item.started = true;
      }

      const eased = local < .16
        ? Math.sin((local / .16) * Math.PI / 2) * .08
        : .08 + .92 * Math.pow((local - .16) / .84, 1.48);
      const sway = Math.sin(local * Math.PI * 2.4 + item.seed) * item.sway * (1 - local * .35);
      const x = item.startX + item.dx * eased + sway;
      const y = item.startY - item.rise * eased - Math.sin(local * Math.PI) * 28;
      const scale = 1 + Math.sin(Math.min(1, local * 2.2) * Math.PI) * .18 + local * .16;
      item.clone.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${item.spin * eased}deg) scale(${scale})`;
      item.clone.style.opacity = String(1 - smoothstep(.90, 1, local));
      item.clone.style.filter = local > .94 ? `blur(${(local - .94) * 24}px)` : 'none';
    });
  }

  function render() {
    renderQueued = false;
    updateScrollState();
    updateFlyingWords();
    selectChapter();
    drawScene();
  }

  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(render);
  }

  sound.addEventListener('click', () => {
    soundOn = !soundOn;
    sound.setAttribute('aria-pressed', String(soundOn));
    sound.textContent = `ROOM SOUND ${soundOn ? 'ON' : 'OFF'}`;
    if (soundOn) {
      audio.volume = .24;
      audio.play().catch(() => {
        soundOn = false;
        sound.setAttribute('aria-pressed', 'false');
        sound.textContent = 'ROOM SOUND OFF';
      });
    } else audio.pause();
  });

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', () => {
    resizeCanvas();
    // Recompute flying-word geometry from the new viewport only for words that
    // have not started yet; active ones continue naturally.
    requestRender();
  });
  addEventListener('pagehide', () => audio.pause());

  Promise.all(Object.entries(paths).map(([key, src]) => loadImage(key, src)))
    .then(() => {
      resizeCanvas();
      enlivenText();
      prepareFlyingWords();
      chapters[0].classList.add('is-visible');
      requestRender();
    })
    .catch(error => {
      console.error('Living Manifesto assets could not load:', error);
      document.body.classList.add('asset-error');
    });
})();
