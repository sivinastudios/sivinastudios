const forestAudio = document.getElementById("forestAudio");
const watersHumAudio = document.getElementById("watersHumAudio");
const journalButton = document.getElementById("journalButton");
const quietPrompt = document.getElementById("quietPrompt");
const whisperSpirit = document.getElementById("whisperSpirit");
const journalReader = document.getElementById("journalReader");
const journalClose = document.getElementById("journalClose");
const journalPage = document.getElementById("journalPage");
const pageFrame = document.getElementById("pageFrame");
const pagePrevious = document.getElementById("pagePrevious");
const pageNext = document.getElementById("pageNext");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const pageCounter = document.getElementById("pageCounter");
const choiceSpirit = document.getElementById("choiceSpirit");
const choiceSmile = document.getElementById("choiceSmile");
const spiritMotes = document.getElementById("spiritMotes");
const cinematicBars = document.getElementById("cinematicBars");
const pageTurnAudio = document.getElementById("pageTurnAudio");
const leatherAudio = document.getElementById("leatherAudio");
const pageOneDust = document.getElementById("pageOneDust");
const pageOneLight = document.getElementById("pageOneLight");
const pageTwoWater = document.getElementById("pageTwoWater");
const pageThreePollen = document.getElementById("pageThreePollen");
const pageThreeTree = document.getElementById("pageThreeTree");
const pageThreeSunbeam = document.getElementById("pageThreeSunbeam");

// Page 1 living memory: intentionally over-exaggerated for the first test.
// The motes exist continuously; opening the journal merely reveals them.
const pageOneDustSystem = (() => {
    if (!pageOneDust) return null;

    const context = pageOneDust.getContext("2d", { alpha: true });
    if (!context) return null;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motes = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let lastTime = performance.now();
    let active = true;

    function random(min, max) { return min + Math.random() * (max - min); }

    function createMote(initial = false) {
        const depth = Math.random();
        return {
            x: random(-width * .08, width * 1.08),
            y: initial ? random(-height * .08, height * 1.08) : height + random(4, height * .2),
            baseX: 0,
            radius: random(.55, 2.7) * (0.55 + depth * .8),
            alpha: random(.14, .72) * (0.55 + depth * .55),
            rise: random(3.8, 15.5) * (0.7 + depth * .55),
            drift: random(5, 24),
            phase: random(0, Math.PI * 2),
            phaseTwo: random(0, Math.PI * 2),
            swaySpeed: random(.16, .52),
            eddySpeed: random(.08, .27),
            pause: random(0, 1),
            twinkle: random(.45, 1.35)
        };
    }

    function resize() {
        const rect = pageOneDust.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        pageOneDust.width = Math.round(width * pixelRatio);
        pageOneDust.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const targetCount = width < 700 ? 54 : 82;
        while (motes.length < targetCount) motes.push(createMote(true));
        if (motes.length > targetCount) motes.length = targetCount;
    }

    function resetMote(mote) {
        Object.assign(mote, createMote(false));
        mote.x = random(-width * .05, width * 1.05);
    }

    function draw(now) {
        animationFrame = requestAnimationFrame(draw);
        if (!active || document.hidden) { lastTime = now; return; }

        const delta = Math.min((now - lastTime) / 1000, .05);
        lastTime = now;
        context.clearRect(0, 0, width, height);

        const time = now / 1000;
        for (const mote of motes) {
            const hesitation = .34 + .66 * (0.5 + 0.5 * Math.sin(time * mote.eddySpeed + mote.phaseTwo));
            mote.y -= mote.rise * hesitation * delta;
            mote.x += (
                Math.sin(time * mote.swaySpeed + mote.phase) * mote.drift +
                Math.cos(time * mote.eddySpeed + mote.phaseTwo) * mote.drift * .42
            ) * delta;

            if (mote.y < -12 || mote.x < -width * .18 || mote.x > width * 1.18) resetMote(mote);

            const shimmer = .60 + .40 * Math.sin(time * mote.twinkle + mote.phase);
            const glow = context.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, mote.radius * 4.2);
            glow.addColorStop(0, `rgba(255,247,213,${mote.alpha * shimmer})`);
            glow.addColorStop(.22, `rgba(255,228,162,${mote.alpha * .52 * shimmer})`);
            glow.addColorStop(1, "rgba(255,218,142,0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(mote.x, mote.y, mote.radius * 4.2, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = `rgba(255,249,226,${Math.min(.9, mote.alpha * (1.12 + shimmer * .35))})`;
            context.beginPath();
            context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
            context.fill();
        }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(pageOneDust);
    resize();
    if (!reduceMotion.matches) animationFrame = requestAnimationFrame(draw);

    reduceMotion.addEventListener?.("change", () => {
        cancelAnimationFrame(animationFrame);
        context.clearRect(0, 0, width, height);
        if (!reduceMotion.matches) {
            lastTime = performance.now();
            animationFrame = requestAnimationFrame(draw);
        }
    });

    return {
        setActive(value) {
            active = value;
            if (!value) context.clearRect(0, 0, width, height);
            else lastTime = performance.now();
        }
    };
})();


// Page 2 living illustration: redraw only the stream sketch and gently
// disturb its ink lines. The page is never covered by a glow layer.
const pageTwoWaterSystem = (() => {
    if (!pageTwoWater) return null;
    const context = pageTwoWater.getContext("2d", { alpha: true });
    if (!context) return null;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const source = new Image();
    source.src = "assets/journal/2.png";

    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let frame = 0;
    let active = false;
    let lastTime = performance.now();

    function resize() {
        const rect = pageTwoWater.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        pageTwoWater.width = Math.round(width * pixelRatio);
        pageTwoWater.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function streamMaskPath() {
        // Coordinates follow the actual stream drawing on journal page 2.
        context.beginPath();
        context.moveTo(width * .29, height * .56);
        context.bezierCurveTo(width * .38, height * .54, width * .48, height * .56, width * .58, height * .59);
        context.bezierCurveTo(width * .70, height * .61, width * .77, height * .66, width * .80, height * .73);
        context.bezierCurveTo(width * .72, height * .82, width * .55, height * .84, width * .37, height * .81);
        context.bezierCurveTo(width * .29, height * .77, width * .27, height * .67, width * .29, height * .56);
        context.closePath();
    }

    function drawInkMemory(now) {
        if (!source.complete || !source.naturalWidth) return;
        const t = now / 1000;
        const sx = source.naturalWidth / width;
        const sy = source.naturalHeight / height;

        context.save();
        streamMaskPath();
        context.clip();

        // Repaint the original ink in narrow horizontal slices. Tiny offsets make
        // the drawn water itself move while rocks, text, and paper remain still.
        const top = height * .55;
        const bottom = height * .84;
        const slice = Math.max(2, height * .0065);
        for (let y = top; y < bottom; y += slice) {
            const normalized = (y - top) / (bottom - top);
            const amplitude = 1.2 + 4.2 * Math.sin(normalized * Math.PI);
            const offset = Math.sin(t * 2.25 + normalized * 15.5) * amplitude
                         + Math.sin(t * .91 + normalized * 31) * 1.4;
            context.drawImage(
                source,
                0, y * sy, source.naturalWidth, Math.ceil(slice * sy + 1),
                offset, y, width, slice + 1
            );
        }

        // Fine highlights trace the stream lines rather than flooding the page.
        context.globalCompositeOperation = "screen";
        context.lineCap = "round";
        for (let i = 0; i < 18; i += 1) {
            const p = (i / 18 + t * (.045 + (i % 4) * .007)) % 1;
            const x = width * (.34 + p * .42);
            const y = height * (.625 + Math.sin(p * Math.PI * 2.25 + i) * .045 + p * .095);
            const len = width * (.018 + (i % 5) * .006);
            const glow = .30 + .42 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.9));
            const grad = context.createLinearGradient(x - len, y, x + len, y);
            grad.addColorStop(0, "rgba(178,225,220,0)");
            grad.addColorStop(.5, `rgba(220,248,238,${glow})`);
            grad.addColorStop(1, "rgba(178,225,220,0)");
            context.strokeStyle = grad;
            context.lineWidth = .8 + (i % 3) * .45;
            context.beginPath();
            context.moveTo(x - len, y);
            context.quadraticCurveTo(x, y + Math.sin(t + i) * 1.6, x + len, y);
            context.stroke();
        }

        // A few drawn ripple rings—small, distinct, and anchored to the pool.
        for (let i = 0; i < 4; i += 1) {
            const cycle = (t * (.19 + i * .014) + i * .27) % 1;
            const cx = width * (.48 + i * .055);
            const cy = height * (.665 + (i % 2) * .025);
            const radius = width * (.008 + cycle * .035);
            const alpha = Math.sin(Math.PI * cycle) * .48;
            context.save();
            context.translate(cx, cy);
            context.scale(1, .32);
            context.strokeStyle = `rgba(196,235,228,${alpha})`;
            context.lineWidth = 1.05;
            context.beginPath();
            context.arc(0, 0, radius, 0, Math.PI * 2);
            context.stroke();
            context.restore();
        }
        context.restore();
    }

    function draw(now) {
        frame = requestAnimationFrame(draw);
        if (!active || document.hidden || reduceMotion.matches) { lastTime = now; return; }
        lastTime = now;
        context.clearRect(0, 0, width, height);
        drawInkMemory(now);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(pageTwoWater);
    resize();
    frame = requestAnimationFrame(draw);

    return {
        setActive(value) {
            active = value;
            context.clearRect(0, 0, width, height);
            if (value) lastTime = performance.now();
        }
    };
})();

// Page 3 living tree: independent ink clusters make the illustration
// read as alive without rocking the entire page.
const pageThreeTreeSystem = (() => {
    if (!pageThreeTree) return null;
    const context = pageThreeTree.getContext("2d", { alpha: true });
    if (!context) return null;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const source = new Image();
    source.src = "assets/journal/3.png";

    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let frame = 0;
    let active = false;

    // Normalized crop regions around the illustrated tree and leaf clusters.
    const clusters = [
        { x:.646, y:.394, w:.105, h:.405, px:.695, py:.796, amp:4.8, speed:.68, phase:.2 },
        { x:.598, y:.525, w:.095, h:.300, px:.646, py:.806, amp:6.1, speed:.83, phase:1.7 },
        { x:.557, y:.635, w:.075, h:.205, px:.596, py:.815, amp:7.0, speed:1.02, phase:3.1 },
        { x:.715, y:.644, w:.073, h:.190, px:.749, py:.820, amp:6.4, speed:.91, phase:4.4 },
        { x:.746, y:.675, w:.058, h:.160, px:.774, py:.823, amp:7.8, speed:1.12, phase:2.5 }
    ];

    function resize() {
        const rect = pageThreeTree.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        pageThreeTree.width = Math.round(width * pixelRatio);
        pageThreeTree.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function createFeatheredCluster(cluster, dw, dh) {
        const sx = cluster.x * source.naturalWidth;
        const sy = cluster.y * source.naturalHeight;
        const sw = cluster.w * source.naturalWidth;
        const sh = cluster.h * source.naturalHeight;
        const offscreen = document.createElement("canvas");
        const offscreenContext = offscreen.getContext("2d", { alpha: true, willReadFrequently: true });
        if (!offscreenContext) return null;

        const renderWidth = Math.max(2, Math.ceil(dw * pixelRatio));
        const renderHeight = Math.max(2, Math.ceil(dh * pixelRatio));
        offscreen.width = renderWidth;
        offscreen.height = renderHeight;
        offscreenContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        offscreenContext.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh);

        // Remove the parchment from each crop instead of merely softening the
        // rectangle. Dark ink remains opaque; the warm paper becomes fully
        // transparent. This leaves only the illustrated branches and leaves
        // available to move, so no gray crop box can appear.
        offscreenContext.setTransform(1, 0, 0, 1, 0, 0);
        const imageData = offscreenContext.getImageData(0, 0, renderWidth, renderHeight);
        const pixels = imageData.data;
        const featherX = Math.max(1, renderWidth * .12);
        const featherY = Math.max(1, renderHeight * .10);

        for (let y = 0; y < renderHeight; y += 1) {
            const edgeY = Math.min(1, y / featherY, (renderHeight - 1 - y) / featherY);
            for (let x = 0; x < renderWidth; x += 1) {
                const index = (y * renderWidth + x) * 4;
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const sourceAlpha = pixels[index + 3] / 255;
                const luminance = red * .2126 + green * .7152 + blue * .0722;

                // Journal parchment in these crops sits mostly above this
                // luminance range. The dark tree ink falls below it.
                const inkAlpha = Math.max(0, Math.min(1, (120 - luminance) / 55));
                const edgeX = Math.min(1, x / featherX, (renderWidth - 1 - x) / featherX);
                const edgeFeather = Math.max(0, edgeX) * Math.max(0, edgeY);
                pixels[index + 3] = Math.round(255 * sourceAlpha * inkAlpha * edgeFeather);
            }
        }

        offscreenContext.clearRect(0, 0, renderWidth, renderHeight);
        offscreenContext.putImageData(imageData, 0, 0);
        return offscreen;
    }

    function drawCluster(cluster, t) {
        const dx = cluster.x * width;
        const dy = cluster.y * height;
        const dw = cluster.w * width;
        const dh = cluster.h * height;
        const pivotX = cluster.px * width;
        const pivotY = cluster.py * height;
        const featheredCluster = createFeatheredCluster(cluster, dw, dh);
        if (!featheredCluster) return;

        const primary = Math.sin(t * cluster.speed + cluster.phase);
        const follow = Math.sin(t * cluster.speed * .43 + cluster.phase * 1.8) * .42;
        const breath = .78 + .22 * Math.pow(.5 + .5 * Math.sin(t * .21 + cluster.phase), 3);
        const degrees = (primary + follow) * cluster.amp * breath;

        context.save();
        context.translate(pivotX, pivotY);
        context.rotate(degrees * Math.PI / 180);
        context.translate(-pivotX, -pivotY);
        context.drawImage(featheredCluster, dx, dy, dw, dh);
        context.restore();
    }

    function draw(now) {
        frame = requestAnimationFrame(draw);
        if (!active || document.hidden || reduceMotion.matches || !source.complete || !source.naturalWidth) return;
        context.clearRect(0, 0, width, height);
        const t = now / 1000;
        for (const cluster of clusters) drawCluster(cluster, t);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(pageThreeTree);
    resize();
    frame = requestAnimationFrame(draw);

    return {
        setActive(value) {
            active = value;
            context.clearRect(0, 0, width, height);
        }
    };
})();

// Page 3 living illustration: there is no visible beam shape. Fine pollen is
// confined to a soft, natural diagonal light region and makes the light legible.
const pageThreePollenSystem = (() => {
    if (!pageThreePollen) return null;
    const context = pageThreePollen.getContext("2d", { alpha: true });
    if (!context) return null;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motes = [];
    let width = 1;
    let height = 1;
    let pixelRatio = 1;
    let frame = 0;
    let lastTime = performance.now();
    let active = false;

    function random(min, max) { return min + Math.random() * (max - min); }

    function lightBounds(y) {
        const n = y / Math.max(1, height);
        // Broad diagonal from the window side, with softly irregular boundaries.
        return {
            left: width * (.16 + n * .11),
            right: width * (.47 + n * .18)
        };
    }

    function createMote(initial = false) {
        const y = random(height * .08, height * .92);
        const bounds = lightBounds(y);
        const depth = Math.random();
        return {
            x: initial ? random(bounds.left, bounds.right) : bounds.left - random(2, width * .025),
            y,
            radius: random(.7, 2.25) * (.75 + depth * .45),
            alpha: random(.30, .76),
            drift: random(4.5, 13.5),
            lift: random(-1.6, 1.6),
            sway: random(2.5, 9),
            swaySpeed: random(.08, .21),
            phase: random(0, Math.PI * 2),
            pauseSpeed: random(.04, .11),
            pausePhase: random(0, Math.PI * 2)
        };
    }

    function resize() {
        const rect = pageThreePollen.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        pageThreePollen.width = Math.round(width * pixelRatio);
        pageThreePollen.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        const target = width < 700 ? 24 : 38;
        while (motes.length < target) motes.push(createMote(true));
        if (motes.length > target) motes.length = target;
    }

    function reset(mote) { Object.assign(mote, createMote(false)); }

    function draw(now) {
        frame = requestAnimationFrame(draw);
        if (!active || document.hidden || reduceMotion.matches) { lastTime = now; return; }
        const delta = Math.min((now - lastTime) / 1000, .05);
        lastTime = now;
        context.clearRect(0, 0, width, height);
        const t = now / 1000;

        for (const mote of motes) {
            const pause = .12 + Math.pow(.5 + .5 * Math.sin(t * mote.pauseSpeed + mote.pausePhase), 4) * .88;
            mote.x += mote.drift * pause * delta;
            mote.y += (mote.lift + Math.sin(t * mote.swaySpeed + mote.phase) * mote.sway) * delta;
            const bounds = lightBounds(mote.y);
            if (mote.x > bounds.right + 10 || mote.x < bounds.left - 12 || mote.y < 0 || mote.y > height) reset(mote);

            const breathe = .72 + .28 * Math.sin(t * .24 + mote.phase);
            const glow = context.createRadialGradient(mote.x, mote.y, 0, mote.x, mote.y, mote.radius * 3.8);
            glow.addColorStop(0, `rgba(255,246,211,${mote.alpha * breathe})`);
            glow.addColorStop(.32, `rgba(246,226,176,${mote.alpha * .34 * breathe})`);
            glow.addColorStop(1, "rgba(238,216,165,0)");
            context.fillStyle = glow;
            context.beginPath();
            context.arc(mote.x, mote.y, mote.radius * 3.8, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = `rgba(255,248,222,${Math.min(.82, mote.alpha * .8)})`;
            context.beginPath();
            context.arc(mote.x, mote.y, Math.max(.45, mote.radius * .48), 0, Math.PI * 2);
            context.fill();
        }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(pageThreePollen);
    resize();
    frame = requestAnimationFrame(draw);

    return {
        setActive(value) {
            active = value;
            context.clearRect(0, 0, width, height);
            if (value) lastTime = performance.now();
        }
    };
})();

const totalPages = 9;
let currentPage = 1;
let isTurning = false;
let touchStartX = null;

const audioFadeFrames = new WeakMap();
function fadeAudio(audio, from, to, duration, onComplete) {
    if (!audio) return;
    const oldFrame = audioFadeFrames.get(audio);
    if (oldFrame) cancelAnimationFrame(oldFrame);

    const startedAt = performance.now();
    audio.volume = Math.max(0, Math.min(1, from));

    function step(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = progress * progress * (3 - 2 * progress);
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
        if (progress < 1) {
            const id = requestAnimationFrame(step);
            audioFadeFrames.set(audio, id);
        } else {
            audioFadeFrames.delete(audio);
            onComplete?.();
        }
    }

    const id = requestAnimationFrame(step);
    audioFadeFrames.set(audio, id);
}

function startWatersHum() {
    if (!watersHumAudio) return;
    watersHumAudio.loop = true;
    watersHumAudio.volume = 0;
    const playPromise = watersHumAudio.play();
    if (playPromise?.then) {
        playPromise.then(() => fadeAudio(watersHumAudio, 0, .52, 900)).catch(() => {});
    }
}

function stopWatersHum(immediate = false) {
    if (!watersHumAudio) return;
    if (immediate) {
        const oldFrame = audioFadeFrames.get(watersHumAudio);
        if (oldFrame) cancelAnimationFrame(oldFrame);
        audioFadeFrames.delete(watersHumAudio);
        watersHumAudio.pause();
        watersHumAudio.currentTime = 0;
        watersHumAudio.volume = 0;
        return;
    }
    const from = watersHumAudio.volume || 0;
    fadeAudio(watersHumAudio, from, 0, 1800, () => {
        watersHumAudio.pause();
        watersHumAudio.currentTime = 0;
    });
}

const FOREST_NORMAL_VOLUME = 0.34;
const FOREST_SILENCE_VOLUME = 0.03;

function applyMemoryAudioState() {
    if (!forestAudio) return;
    // Page 3 is intentionally abrupt: silence arrives with the click.
    forestAudio.volume = currentPage === 3 ? FOREST_SILENCE_VOLUME : FOREST_NORMAL_VOLUME;
}

function stopWatersHumImmediately() {
    if (!watersHumAudio) return;
    const oldFrame = audioFadeFrames.get(watersHumAudio);
    if (oldFrame) cancelAnimationFrame(oldFrame);
    audioFadeFrames.delete(watersHumAudio);
    watersHumAudio.pause();
    watersHumAudio.currentTime = 0;
    watersHumAudio.volume = 0;
}

function startForest() {
    if (!forestAudio) return;
    forestAudio.volume = 0;
    const savedTime = Number(sessionStorage.getItem("forestAudioTime"));
    if (Number.isFinite(savedTime) && savedTime > 0) forestAudio.currentTime = savedTime;

    const play = () => {
        forestAudio.play()
            .then(() => fadeAudio(forestAudio, 0, FOREST_NORMAL_VOLUME, 4200))
            .catch(() => {});
    };

    play();
    if (forestAudio.paused) {
        const resume = () => play();
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
    }
}

function beginSpiritSequence() {
    spiritMotes?.classList.add("is-forming");

    window.setTimeout(() => {
        whisperSpirit?.classList.add("is-traveling");
    }, 900);

    // The bars arrive only after the spirit crosses the window threshold.
    window.setTimeout(() => cinematicBars?.classList.add("is-active"), 3600);

    // The journal senses the approaching spirit before contact.
    window.setTimeout(() => journalButton?.classList.add("is-anticipating"), 15100);

    window.setTimeout(() => {
        whisperSpirit?.classList.remove("is-traveling");
        whisperSpirit?.classList.add("is-transforming");
    }, 16700);

    window.setTimeout(() => {
        whisperSpirit?.classList.remove("is-transforming");
        whisperSpirit?.classList.add("is-hovering");
        journalButton?.classList.remove("is-anticipating");
        journalButton?.classList.add("is-ready");
        quietPrompt?.classList.add("is-visible");
        cinematicBars?.classList.remove("is-active");
    }, 19600);
}

function updatePageUI() {
    journalPage.src = `assets/journal/${currentPage}.png`;
    journalPage.alt = `Sawa's journal, page ${currentPage}`;
    pageCounter.textContent = `${currentPage} / ${totalPages}`;
    previousButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    pagePrevious.disabled = currentPage === 1;
    pageNext.disabled = currentPage === totalPages;

    const isPageOne = currentPage === 1;
    const isPageTwo = currentPage === 2;
    const isPageThree = currentPage === 3;
    pageFrame.classList.toggle("page-one-living", isPageOne);
    pageFrame.classList.toggle("page-two-living", isPageTwo);
    pageFrame.classList.toggle("page-three-living", isPageThree);
    pageOneDustSystem?.setActive(isPageOne);
    pageTwoWaterSystem?.setActive(isPageTwo);
    pageThreeTreeSystem?.setActive(isPageThree);
    pageThreePollenSystem?.setActive(isPageThree);

    applyMemoryAudioState();
    if (isPageTwo && journalReader.classList.contains("is-open")) startWatersHum();
    else if (isPageThree) stopWatersHumImmediately();
    else stopWatersHum();

    const isChoicePage = currentPage === totalPages;
    choiceSpirit.classList.toggle("is-visible", isChoicePage);
    choiceSmile.classList.toggle("is-visible", isChoicePage);
}

function playOptionalAudio(audio, volume = 0.35, delay = 0) {
    if (!audio) return;
    window.setTimeout(() => {
        try {
            audio.currentTime = 0;
            audio.volume = volume;
            audio.play().catch(() => {});
        } catch (_) {}
    }, delay);
}

function turnTo(page, direction) {
    if (isTurning || page < 1 || page > totalPages || page === currentPage) return;
    isTurning = true;
    playOptionalAudio(leatherAudio, 0.16);
    playOptionalAudio(pageTurnAudio, 0.28, 70);
    pageFrame.classList.add(direction === "back" ? "is-turning-back" : "is-turning-forward");

    window.setTimeout(() => {
        currentPage = page;
        updatePageUI();
        pageFrame.classList.remove("is-turning-back", "is-turning-forward");
        window.setTimeout(() => { isTurning = false; }, 300);
    }, 280);
}

function openJournal() {
    if (!journalButton.classList.contains("is-ready")) return;
    journalReader.classList.add("is-open");
    journalReader.setAttribute("aria-hidden", "false");
    document.body.classList.add("reading-journal");
    quietPrompt?.classList.remove("is-visible");
    applyMemoryAudioState();
    if (currentPage === 2) startWatersHum();
    if (currentPage === 3) stopWatersHumImmediately();
    window.setTimeout(() => journalClose?.focus(), 900);
}

function closeJournal() {
    stopWatersHum();
    if (forestAudio) forestAudio.volume = FOREST_NORMAL_VOLUME;
    journalReader.classList.remove("is-open");
    journalReader.setAttribute("aria-hidden", "true");
    document.body.classList.remove("reading-journal");
    quietPrompt?.classList.add("is-visible");
    journalButton?.focus();
}

journalButton?.addEventListener("click", openJournal);
journalClose?.addEventListener("click", closeJournal);
document.querySelector("[data-close-journal]")?.addEventListener("click", closeJournal);
previousButton?.addEventListener("click", () => turnTo(currentPage - 1, "back"));
nextButton?.addEventListener("click", () => turnTo(currentPage + 1, "forward"));
pagePrevious?.addEventListener("click", () => turnTo(currentPage - 1, "back"));
pageNext?.addEventListener("click", () => turnTo(currentPage + 1, "forward"));

pageFrame?.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
}, { passive: true });
pageFrame?.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const distance = endX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 45) return;
    if (distance < 0) turnTo(currentPage + 1, "forward");
    else turnTo(currentPage - 1, "back");
}, { passive: true });

window.addEventListener("keydown", (event) => {
    if (!journalReader.classList.contains("is-open")) return;
    if (event.key === "Escape") closeJournal();
    if (event.key === "ArrowRight") turnTo(currentPage + 1, "forward");
    if (event.key === "ArrowLeft") turnTo(currentPage - 1, "back");
});

[choiceSpirit, choiceSmile].forEach((choice) => {
    choice?.addEventListener("click", () => {
        sessionStorage.setItem("forestAudioTime", String(forestAudio?.currentTime || 0));
    });
});

window.addEventListener("load", () => {
    startForest();
    updatePageUI();
    window.setTimeout(beginSpiritSequence, 5600);
});

let forestWasPlayingBeforeHidden = false;

function pauseForestForBackground() {
    if (!forestAudio) return;
    forestWasPlayingBeforeHidden = !forestAudio.paused;
    sessionStorage.setItem("forestAudioTime", String(forestAudio.currentTime || 0));
    forestAudio.pause();
    watersHumAudio?.pause();
}

function resumeForestAfterBackground() {
    if (!forestAudio || !forestWasPlayingBeforeHidden) return;
    forestWasPlayingBeforeHidden = false;
    forestAudio.play().catch(() => {
        // A browser may require one fresh interaction after restoring a tab.
        const resume = () => forestAudio.play().catch(() => {});
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
    });
    if (currentPage === 2 && journalReader.classList.contains("is-open") && watersHumAudio) {
        watersHumAudio.play().catch(() => {});
    }
}

// Pause while another tab or webpage is being viewed, then continue from the
// same moment when the visitor returns. Never rewind the ambience here.
document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseForestForBackground();
    else resumeForestAfterBackground();
});

window.addEventListener("pagehide", () => {
    if (!forestAudio) return;
    sessionStorage.setItem("forestAudioTime", String(forestAudio.currentTime || 0));
    forestAudio.pause();
    watersHumAudio?.pause();
});
