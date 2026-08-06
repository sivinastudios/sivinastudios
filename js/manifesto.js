(() => {
  const root = document.documentElement;
  const canvas = document.getElementById('sceneCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const doc = document.getElementById('manifestoDocument');
  const viewport = document.getElementById('documentViewport');
  const chapters = [...document.querySelectorAll('.chapter')];
  const links = [];
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
  let targetKnowing = 0;
  let knowing = 0;
  let docTarget = 0;
  let docCurrent = 0;
  let soundOn = false;
  let frame = 0;
  let cover = { x: 0, y: 0, w: 0, h: 0 };
  let eraseMarks = [];
  let colorMarks = [];
  let lastSizeKey = '';
  let flyingWords = [];
  let wordTrails = [];
  let escapeProgress = 0;

  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
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

  function buildMarks() {
    const rand = seededRandom(1234567);
    eraseMarks = [];
    colorMarks = [];
    const cx = cover.x + cover.w * 0.50;
    const cy = cover.y + cover.h * 0.43;
    const maxD = Math.hypot(canvas.width, canvas.height);

    // Broad, hand-rubbed eraser strokes. These avoid the circular holes that
    // made the previous pass resemble a burning Polaroid.
    for (let i = 0; i < 420; i++) {
      const angle = (rand() - .5) * .9;
      const length = (140 + rand() * 420) * devicePixelRatio;
      const width = (18 + rand() * 58) * devicePixelRatio;
      const x = rand() * canvas.width;
      const y = rand() * canvas.height;
      const d = Math.hypot(x - cx, y - cy) / maxD;
      const inLaptop = x > cover.x + cover.w * .08 && x < cover.x + cover.w * .91 &&
        y > cover.y + cover.h * .05 && y < cover.y + cover.h * .84;
      const laptopBias = inLaptop ? -.18 : 0;
      eraseMarks.push({
        x1: x - Math.cos(angle) * length * .5,
        y1: y - Math.sin(angle) * length * .5,
        x2: x + Math.cos(angle) * length * .5,
        y2: y + Math.sin(angle) * length * .5,
        width,
        order: clamp(d + laptopBias + (rand() - .5) * .12),
        alpha: .48 + rand() * .42
      });
    }
    eraseMarks.sort((a, b) => a.order - b.order);

    for (let i = 0; i < 520; i++) {
      const x = rand() * canvas.width;
      const y = rand() * canvas.height;
      const d = Math.hypot(x - cx, y - cy) / maxD;
      colorMarks.push({
        x, y,
        r: (55 + rand() * 190) * devicePixelRatio,
        order: clamp(d * .78 + (rand() - .5) * .22),
        soft: .5 + rand() * .32
      });
    }
    colorMarks.sort((a, b) => a.order - b.order);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;

    // Full-bleed 3:2 scene. Scale like CSS background-size: cover so the
    // environment always reaches every edge of the browser with no black bars.
    const imageRatio = 1536 / 1024;
    const viewportRatio = canvas.width / canvas.height;
    let dw;
    let dh;

    if (viewportRatio > imageRatio) {
      dw = canvas.width;
      dh = dw / imageRatio;
    } else {
      dh = canvas.height;
      dw = dh * imageRatio;
    }

    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;
    cover = { x: dx, y: dy, w: dw, h: dh };

    // Exact normalized coordinates of the laptop's luminous screen in the 1536×1024 master frames.
    const sx = dx + dw * (156 / 1536);
    const sy = dy + dh * (81 / 1024);
    const sw = dw * (1225 / 1536);
    const sh = dh * (778 / 1024);
    root.style.setProperty('--screen-left', `${sx / dpr}px`);
    root.style.setProperty('--screen-top', `${sy / dpr}px`);
    root.style.setProperty('--screen-width', `${sw / dpr}px`);
    root.style.setProperty('--screen-height', `${sh / dpr}px`);

    const key = `${canvas.width}x${canvas.height}`;
    if (key !== lastSizeKey) { lastSizeKey = key; buildMarks(); }
  }

  function createLayer(img) {
    const layer = document.createElement('canvas');
    layer.width = canvas.width;
    layer.height = canvas.height;
    const lctx = layer.getContext('2d');
    lctx.drawImage(img, cover.x, cover.y, cover.w, cover.h);
    return { layer, lctx };
  }

  function eraseWithMarks(layerCtx, marks, progress, edge = .14) {
    if (progress <= 0) return;
    layerCtx.save();
    layerCtx.globalCompositeOperation = 'destination-out';
    layerCtx.lineCap = 'round';
    layerCtx.lineJoin = 'round';

    for (const mark of marks) {
      const local = clamp((progress - mark.order) / edge);
      if (local <= 0) continue;

      // Several translucent passes build up a dry, rubbed-pencil erasure.
      const passes = 5;
      for (let pass = 0; pass < passes; pass++) {
        const wobble = (pass - 1) * mark.width * .18;
        layerCtx.globalAlpha = Math.min(1, mark.alpha * (0.58 + local * 1.35) * (pass === 2 ? 1 : .82));
        layerCtx.lineWidth = mark.width * (.62 + local * 1.18) * (1 - pass * .055);
        layerCtx.beginPath();
        layerCtx.moveTo(mark.x1, mark.y1 + wobble);
        layerCtx.quadraticCurveTo(
          (mark.x1 + mark.x2) * .5 + Math.sin(mark.order * 31) * mark.width,
          (mark.y1 + mark.y2) * .5 + Math.cos(mark.order * 27) * mark.width * .65 + wobble,
          mark.x2,
          mark.y2 + wobble
        );
        layerCtx.stroke();
      }
    }
    // At the very end, finish the physical erasure completely so no photographic
    // islands remain. This is delayed until the final fraction of Knowing.
    if (progress >= .985) {
      layerCtx.globalCompositeOperation = 'destination-out';
      layerCtx.globalAlpha = smoothstep(.985, 1, progress);
      layerCtx.fillRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);
    }
    layerCtx.restore();
  }


  function eraseWithWordTrails(layerCtx) {
    if (!wordTrails.length) return;
    layerCtx.save();
    layerCtx.globalCompositeOperation = 'destination-out';
    for (const trail of wordTrails) {
      const gradient = layerCtx.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, trail.r);
      gradient.addColorStop(0, `rgba(0,0,0,${trail.alpha})`);
      gradient.addColorStop(.62, `rgba(0,0,0,${trail.alpha * .72})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      layerCtx.fillStyle = gradient;
      layerCtx.beginPath();
      layerCtx.arc(trail.x, trail.y, trail.r, 0, Math.PI * 2);
      layerCtx.fill();
    }
    layerCtx.restore();
  }

  function updateFlyingWords() {
    if (!flyingWords.length) return;
    let completed = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    wordTrails = [];

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

      // Hold the word clearly in view, then accelerate it beyond the page edge.
      const eased = local < .16
        ? Math.sin((local / .16) * Math.PI / 2) * .08
        : .08 + .92 * Math.pow((local - .16) / .84, 1.55);
      const sway = Math.sin(local * Math.PI * 2.6 + item.seed) * item.sway * (1 - local * .35);
      const x = item.startX + item.dx * eased + sway;
      const y = item.startY - item.rise * eased - Math.sin(local * Math.PI) * 34;
      const scale = 1 + Math.sin(Math.min(1, local * 2.2) * Math.PI) * .22 + local * .2;
      item.clone.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${item.spin * eased}deg) scale(${scale})`;
      item.clone.style.opacity = String(1 - smoothstep(.90, 1, local));
      item.clone.style.filter = `blur(${Math.max(0, (local - .90) * 18)}px)`;

      // The departing word triggers the erasure only after its escape is obvious.
      const eraseWake = smoothstep(.28, .82, local);
      if (eraseWake > 0) {
        const radius = (34 + item.width * .38 + eraseWake * 112) * dpr;
        wordTrails.push({ x: x * dpr, y: y * dpr, r: radius, alpha: (.28 + eraseWake * .62) * eraseWake });
      }
      if (local >= 1) completed++;
    });

    escapeProgress = clamp((completed + wordTrails.length * .42) / flyingWords.length);
  }

  function revealWithMarks(base, reveal, marks, progress) {
    const revealCanvas = document.createElement('canvas');
    revealCanvas.width = canvas.width;
    revealCanvas.height = canvas.height;
    const rctx = revealCanvas.getContext('2d');
    rctx.drawImage(reveal, 0, 0);
    const mask = document.createElement('canvas');
    mask.width = canvas.width;
    mask.height = canvas.height;
    const mctx = mask.getContext('2d');
    for (const mark of marks) {
      const local = clamp((progress - mark.order) / .11);
      if (local <= 0) continue;
      const radius = mark.r * (0.25 + local * .92);
      const gradient = mctx.createRadialGradient(mark.x, mark.y, radius * mark.soft, mark.x, mark.y, radius);
      gradient.addColorStop(0, `rgba(255,255,255,${local})`);
      gradient.addColorStop(.75, `rgba(255,255,255,${local * .72})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = gradient;
      mctx.beginPath();
      mctx.arc(mark.x, mark.y, radius, 0, Math.PI * 2);
      mctx.fill();
    }
    // Broad translucent washes prevent the bloom from reading as isolated circles.
    if (progress > .12) {
      const wash = smoothstep(.12, .96, progress);
      mctx.save();
      mctx.globalAlpha = wash * .32;
      mctx.filter = `blur(${Math.max(18, canvas.width * .018)}px)`;
      mctx.fillStyle = '#fff';
      const spread = canvas.width * (.18 + wash * .82);
      mctx.fillRect(canvas.width * .5 - spread * .5, canvas.height * .12, spread, canvas.height * .76);
      mctx.restore();
    }
    rctx.globalCompositeOperation = 'destination-in';
    rctx.drawImage(mask, 0, 0);
    if (progress >= .985) {
      rctx.globalCompositeOperation = 'source-over';
      rctx.globalAlpha = smoothstep(.985, 1, progress);
      rctx.drawImage(reveal, 0, 0);
    }
    base.drawImage(revealCanvas, 0, 0);
  }

  function drawScene() {
    if (!images.reality) return;
    ctx.fillStyle = '#171316';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const reality = createLayer(images.reality);
    const sketch = createLayer(images.sketch);
    const watercolor = createLayer(images.watercolor);

    // Scroll choreography:
    // 0–20%   reality remains untouched
    // 20–80%  reality slowly erases, revealing the sketch beneath
    // 60–100% watercolor gradually enters and finishes the transformation
    const eraseProgress = Math.max(smoothstep(.20, .80, knowing) * .72, escapeProgress);
    const watercolorProgress = smoothstep(.60, 1.00, knowing);

    ctx.drawImage(sketch.layer, 0, 0);
    revealWithMarks(ctx, watercolor.layer, colorMarks, watercolorProgress);
    eraseWithWordTrails(reality.lctx);
    eraseWithMarks(reality.lctx, eraseMarks, eraseProgress);
    ctx.drawImage(reality.layer, 0, 0);

    const breathe = 1 + Math.sin(frame * .008) * .008;
    ctx.save();
    ctx.globalAlpha = .035 * breathe;
    ctx.fillStyle = '#f6e9dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function updateScrollTargets() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = clamp(scrollY / max);
    targetKnowing = progress;
    const docMax = Math.max(0, doc.scrollHeight - viewport.clientHeight);
    docTarget = progress * docMax;
    scrollCue.style.opacity = progress > .035 ? '0' : '1';
  }

  function selectChapter() {
    const center = docCurrent + viewport.clientHeight * .44;
    let active = 0;
    chapters.forEach((chapter, i) => {
      if (center >= chapter.offsetTop) active = i;
      chapter.classList.toggle('is-visible', i === active || Math.abs(i - active) === 1);
    });
    links.forEach((link, i) => link.classList.toggle('is-active', i === active));
    chapterNumber.textContent = String(active + 1).padStart(2, '0');
  }

  function enlivenText() {
    const candidates = [...document.querySelectorAll('.chapter h1, .chapter h2, .chapter p')];
    candidates.forEach((el, elementIndex) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach((node, nodeIndex) => {
        const frag = document.createDocumentFragment();
        const tokens = node.nodeValue.match(/\s+|[^\s]+/g) || [];

        tokens.forEach((token, tokenIndex) => {
          if (/^\s+$/.test(token)) {
            frag.append(token);
            return;
          }

          // Keep each word intact so the browser can never split “understood”
          // between individually animated letters.
          const word = document.createElement('span');
          word.className = 'living-word-unit';

          [...token].forEach((char, charIndex) => {
            const span = document.createElement('span');
            span.className = 'living-letter';
            span.textContent = char;
            const n = (elementIndex * 19 + nodeIndex * 13 + tokenIndex * 7 + charIndex * 5) % 47;
            if (n === 3 || n === 11 || n === 31) span.classList.add('is-breathing');
            if (n === 17 || n === 39) span.classList.add('is-flickering');
            if (n === 27) span.classList.add('is-shifting');
            span.style.animationDelay = `${((elementIndex * 3 + tokenIndex + charIndex) % 17) * -.61}s`;
            word.append(span);
          });
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
    const desired = Math.min(24, Math.max(14, Math.floor(words.length / 28)));
    for (let i = 0; i < words.length && chosen.length < desired; i++) {
      if (rand() < .055) chosen.push(words[i]);
    }
    for (let i = 0; chosen.length < desired && i < words.length; i += Math.max(1, Math.floor(words.length / desired))) {
      if (!chosen.includes(words[i])) chosen.push(words[i]);
    }

    flyingWords = chosen.slice(0, desired).map((source, index, arr) => {
      // Only words selected to fly receive the white mist while they wait.
      source.classList.add('trigger-word');
      const clone = source.cloneNode(true);
      clone.className = 'flying-word';
      clone.style.display = 'none';
      document.body.appendChild(clone);
      const base = arr.length === 1 ? .5 : index / (arr.length - 1);
      return {
        source, clone, started:false,
        trigger: .20 + base * .58 + (rand() - .5) * .022,
        duration: .13 + rand() * .055,
        dx: (rand() < .5 ? -1 : 1) * innerWidth * (.58 + rand() * .42),
        rise: innerHeight * (1.18 + rand() * .55),
        sway: 28 + rand() * 58,
        spin: (rand() - .5) * 24,
        seed: rand() * Math.PI * 2,
        width: 0, startX: 0, startY: 0
      };
    }).sort((a,b) => a.trigger - b.trigger);
  }

  function tick() {
    frame++;
    knowing += (targetKnowing - knowing) * .018;
    docCurrent += (docTarget - docCurrent) * .075;
    root.style.setProperty('--knowing', knowing.toFixed(4));
    root.style.setProperty('--presence', ((Math.sin(frame * .012) + 1) / 2).toFixed(4));
    updateFlyingWords();
    doc.style.transform = `translate3d(0,${-docCurrent}px,0)`;
    progressLabel.textContent = `KNOWING ${String(Math.round(knowing * 100)).padStart(2, '0')}`;
    selectChapter();
    drawScene();
    requestAnimationFrame(tick);
  }

  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    const docMax = Math.max(1, doc.scrollHeight - viewport.clientHeight);
    const p = clamp(target.offsetTop / docMax);
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: p * max, behavior: 'smooth' });
  }));

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
    }
    else audio.pause();
  });

  addEventListener('scroll', updateScrollTargets, { passive: true });
  addEventListener('resize', () => { resizeCanvas(); updateScrollTargets(); });
  addEventListener('pagehide', () => audio.pause());

  Promise.all(Object.entries(paths).map(([key, src]) => loadImage(key, src)))
    .then(() => {
      resizeCanvas();
      enlivenText();
      prepareFlyingWords();
      updateScrollTargets();
      chapters[0].classList.add('is-visible');
      requestAnimationFrame(tick);
    })
    .catch(error => {
      console.error('Living Manifesto assets could not load:', error);
      document.body.classList.add('asset-error');
    });
})();
