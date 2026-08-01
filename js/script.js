const beginButton = document.getElementById("beginJourney");
const firstSection = document.getElementById("firstSection");
const journeyMusic = document.getElementById("journeyMusic");
const storySections = document.querySelectorAll(".story-section:not(.threshold-section)");
const thresholdSection = document.querySelector(".threshold-section");
const guideLight = document.querySelector(".guide-light");
const philosophyHeading = document.querySelector(".philosophy-content h2");
const experienceHeading = document.querySelector(".experience-content h2");
const thresholdMemory = document.querySelector(".threshold-content h2 span");
const thresholdInvitation = document.querySelector(".threshold-invitation");
const worldGate = document.querySelector(".world-gate");
const worldGateEmblem = document.querySelector(".world-gate-emblem");
const sivinaHome = document.getElementById("sivinaHome");
const yumemoriView = document.getElementById("yumemoriView");
const yumemoriReturn = document.querySelector(".yumemori-return");

let journeyHasBegun = false;
let guideMotionStartedAt = performance.now();
let guideFireflies = [];
let guideFireflyMobileMode = null;
let swarmRevealStartedAt = Number.NEGATIVE_INFINITY;

const returnParams = new URLSearchParams(window.location.search);
const isReturningFromYumemori =
    returnParams.get("return") === "1" ||
    sessionStorage.getItem("sivinaJourneyComplete") === "true";

function restoreCompletedJourney() {
    if (!isReturningFromYumemori) return;

    journeyHasBegun = true;
    startGuideAnimation();
    document.body.classList.remove("journey-locked");
    document.body.classList.add("journey-started", "journey-restored", "journey-stone");
    swarmRevealStartedAt = performance.now() - 6000;
    beginButton?.setAttribute("disabled", "");
    beginButton?.classList.add("is-leaving");

    storySections.forEach((section) => section.classList.add("is-visible"));
    thresholdSection?.classList.add("is-visible");
    worldGate?.classList.add("is-awake");

    requestAnimationFrame(() => {
        thresholdSection?.scrollIntoView({ behavior: "auto", block: "end" });
        requestGuideUpdate();
    });

    if (returnParams.has("return")) {
        history.replaceState({}, "", `${window.location.pathname}#threshold`);
    }
}


function fadeInMusic() {
    if (!journeyMusic) return;

    journeyMusic.volume = 0;

    journeyMusic.play().then(() => {
        const targetVolume = 0.5;
        const fadeDuration = 2600;
        const startTime = performance.now();

        function raiseVolume(now) {
            const progress = Math.min((now - startTime) / fadeDuration, 1);
            journeyMusic.volume = targetVolume * progress;

            if (progress < 1) {
                requestAnimationFrame(raiseVolume);
            }
        }

        requestAnimationFrame(raiseVolume);
    }).catch((error) => {
        console.log("Music could not begin:", error);
    });
}

beginButton?.addEventListener("click", () => {
    if (journeyHasBegun) return;

    journeyHasBegun = true;
    beginButton.disabled = true;
    beginButton.classList.add("is-leaving");

    fadeInMusic();
    document.body.classList.remove("journey-locked");
    document.body.classList.add("journey-started", "journey-stone");
    swarmRevealStartedAt = performance.now();
    guideLight?.classList.add("is-arriving");
    updateGuideLight();
    startGuideAnimation();

    window.setTimeout(() => {
        firstSection?.classList.add("is-visible");
        firstSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 620);
});

const sectionObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                sectionObserver.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.28,
        rootMargin: "0px 0px -8% 0px"
    }
);

storySections.forEach((section) => sectionObserver.observe(section));

if (thresholdSection) {
    const thresholdObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    thresholdObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.08,
            rootMargin: "0px 0px -4% 0px"
        }
    );

    thresholdObserver.observe(thresholdSection);
}


function elementCenter(element, fallbackX, fallbackY) {
    if (!element) return { x: fallbackX, y: fallbackY };

    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

function mix(start, end, amount) {
    return start + (end - start) * amount;
}

function smoothStep(amount) {
    const value = Math.max(0, Math.min(1, amount));
    return value * value * (3 - 2 * value);
}


function seededRange(seed, minimum, maximum) {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    const normalized = value - Math.floor(value);
    return minimum + (maximum - minimum) * normalized;
}

function buildGuideFireflySwarm() {
    if (!guideLight) return;

    const mobileMode = window.matchMedia("(max-width: 700px)").matches;
    if (guideFireflies.length && guideFireflyMobileMode === mobileMode) return;

    guideLight.querySelectorAll(".guide-firefly").forEach((firefly) => firefly.remove());
    guideFireflies = [];
    guideFireflyMobileMode = mobileMode;

    const count = mobileMode ? 5 : 8;

    for (let index = 0; index < count; index += 1) {
        const element = document.createElement("span");
        element.className = "guide-firefly";
        element.setAttribute("aria-hidden", "true");

        const firefly = {
            element,
            radiusX: seededRange(index + 1, mobileMode ? 24 : 34, mobileMode ? 54 : 88),
            radiusY: seededRange(index + 11, mobileMode ? 18 : 26, mobileMode ? 44 : 68),
            speedX: seededRange(index + 21, 0.34, 0.78),
            speedY: seededRange(index + 31, 0.28, 0.72),
            phaseX: seededRange(index + 41, 0, Math.PI * 2),
            phaseY: seededRange(index + 51, 0, Math.PI * 2),
            flutterSpeed: seededRange(index + 61, 1.1, 2.25),
            flutterPhase: seededRange(index + 71, 0, Math.PI * 2),
            peelStrength: index === 0 ? (mobileMode ? 18 : 34) : seededRange(index + 81, 2, 13),
            peelSpeed: index === 0 ? 0.105 : seededRange(index + 91, 0.12, 0.24),
            size: seededRange(index + 101, mobileMode ? 3.1 : 3.5, mobileMode ? 5.2 : 6.5),
            baseOpacity: seededRange(index + 111, 0.38, 0.82),
            glow: seededRange(index + 121, 8, 18)
        };

        element.style.setProperty("--firefly-size", `${firefly.size.toFixed(2)}px`);
        element.style.setProperty("--firefly-glow", `${firefly.glow.toFixed(2)}px`);
        guideLight.appendChild(element);
        guideFireflies.push(firefly);
    }
}

function updateGuideFireflySwarm(elapsed, leaderOpacity) {
    if (!guideFireflies.length) buildGuideFireflySwarm();

    guideFireflies.forEach((firefly, index) => {
        const slowX = Math.sin(elapsed * firefly.speedX + firefly.phaseX);
        const slowY = Math.cos(elapsed * firefly.speedY + firefly.phaseY);
        const flutter = Math.sin(elapsed * firefly.flutterSpeed + firefly.flutterPhase);
        const peelEnvelope = Math.max(0, Math.sin(elapsed * firefly.peelSpeed + firefly.phaseX));
        const peel = Math.pow(peelEnvelope, index === 0 ? 10 : 18) * firefly.peelStrength;

        const x = slowX * firefly.radiusX + flutter * 5 + peel;
        const y = slowY * firefly.radiusY + Math.cos(elapsed * 1.37 + firefly.flutterPhase) * 4 - peel * 0.28;
        const pulse = 0.72 + 0.28 * Math.sin(elapsed * (1.25 + index * 0.07) + firefly.phaseY);
        const revealDelay = 1500 + index * 180;
        const revealProgress = smoothStep((performance.now() - swarmRevealStartedAt - revealDelay) / 1800);
        const opacity = Math.max(0, Math.min(1, firefly.baseOpacity * pulse * Math.min(1, leaderOpacity * 1.35) * revealProgress));

        firefly.element.style.setProperty("--firefly-x", `${x.toFixed(2)}px`);
        firefly.element.style.setProperty("--firefly-y", `${y.toFixed(2)}px`);
        firefly.element.style.setProperty("--firefly-opacity", opacity.toFixed(3));
    });
}

function updateGuideLight() {
    if (!guideLight || !journeyHasBegun) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
    const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));

    const waypoints = [
        { progress: 0.00, x: viewportWidth * 0.50, y: viewportHeight * 0.82, opacity: 0.00, scale: 0.62 },
        { progress: 0.08, ...elementCenter(philosophyHeading, viewportWidth * 0.72, viewportHeight * 0.58), opacity: 0.78, scale: 0.76 },
        { progress: 0.30, x: viewportWidth * 0.76, y: viewportHeight * 0.60, opacity: 0.86, scale: 0.82 },
        { progress: 0.49, ...elementCenter(experienceHeading, viewportWidth * 0.25, viewportHeight * 0.45), opacity: 0.72, scale: 0.72 },
        { progress: 0.68, x: viewportWidth * 0.72, y: viewportHeight * 0.66, opacity: 0.86, scale: 0.88 },
        { progress: 0.82, ...elementCenter(thresholdMemory, viewportWidth * 0.50, viewportHeight * 0.48), opacity: 0.96, scale: 0.95 },
        { progress: 0.91, ...elementCenter(thresholdInvitation, viewportWidth * 0.50, viewportHeight * 0.68), opacity: 0.72, scale: 1.02 },
        { progress: 0.97, ...elementCenter(worldGateEmblem, viewportWidth * 0.50, viewportHeight * 0.78), opacity: 0.98, scale: 0.88 },
        { progress: 1.00, ...elementCenter(worldGateEmblem, viewportWidth * 0.50, viewportHeight * 0.78), opacity: 0.00, scale: 0.38 }
    ];

    let start = waypoints[0];
    let end = waypoints[waypoints.length - 1];
    let segmentIndex = 0;

    for (let index = 0; index < waypoints.length - 1; index += 1) {
        if (progress >= waypoints[index].progress && progress <= waypoints[index + 1].progress) {
            start = waypoints[index];
            end = waypoints[index + 1];
            segmentIndex = index;
            break;
        }
    }

    const range = Math.max(end.progress - start.progress, 0.001);
    const rawLocalProgress = Math.max(0, Math.min(1, (progress - start.progress) / range));

    // The guide still follows the visitor's scroll, but it never travels in a
    // perfectly straight UI-like line. Each leg bows gently like a firefly
    // finding its own way to the next resting place.
    const localProgress = smoothStep(rawLocalProgress);
    const baseX = mix(start.x, end.x, localProgress);
    const baseY = mix(start.y, end.y, localProgress);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const perpendicularX = -dy / distance;
    const perpendicularY = dx / distance;
    const curveDirection = segmentIndex % 2 === 0 ? 1 : -1;
    const curveStrength = Math.min(72, Math.max(24, distance * 0.12));
    const curveEnvelope = Math.sin(Math.PI * rawLocalProgress);

    // Layered, unequal rhythms prevent a repeating mechanical bob. The
    // movement is deliberately exaggerated for the v1.1 development pass.
    const elapsed = (performance.now() - guideMotionStartedAt) / 1000;
    const wanderEnvelope = 0.35 + curveEnvelope * 0.65;
    const wanderX = (
        Math.sin(elapsed * 0.91 + segmentIndex * 1.7) * 13 +
        Math.sin(elapsed * 0.37 + 1.2) * 8 +
        Math.cos(elapsed * 1.63 + segmentIndex) * 4
    ) * wanderEnvelope;
    const wanderY = (
        Math.cos(elapsed * 0.73 + segmentIndex * 1.1) * 11 +
        Math.sin(elapsed * 0.29 + 2.4) * 7 +
        Math.sin(elapsed * 1.41) * 3
    ) * wanderEnvelope;

    const x = baseX + perpendicularX * curveStrength * curveEnvelope * curveDirection + wanderX;
    const y = baseY + perpendicularY * curveStrength * curveEnvelope * curveDirection + wanderY;
    const opacity = mix(start.opacity, end.opacity, localProgress);
    const breathingScale = 1 + Math.sin(elapsed * 1.17) * 0.055 + Math.sin(elapsed * 0.43 + 1.8) * 0.025;
    const scale = mix(start.scale, end.scale, localProgress) * breathingScale;

    guideLight.style.setProperty("--guide-x", `${x}px`);
    guideLight.style.setProperty("--guide-y", `${y}px`);
    guideLight.style.setProperty("--guide-opacity", opacity.toFixed(3));
    guideLight.style.setProperty("--guide-scale", scale.toFixed(3));
    updateGuideFireflySwarm(elapsed, opacity);

    if (worldGate) {
        worldGate.classList.toggle("is-awake", progress >= 0.955);
    }
}

let guideFrameRequested = false;
let guideAnimationFrame = 0;

function animateGuideLight() {
    if (!journeyHasBegun || document.hidden) {
        guideAnimationFrame = 0;
        return;
    }

    updateGuideLight();
    guideAnimationFrame = requestAnimationFrame(animateGuideLight);
}

function startGuideAnimation() {
    if (guideAnimationFrame || !journeyHasBegun || document.hidden) return;
    guideMotionStartedAt = performance.now();
    guideAnimationFrame = requestAnimationFrame(animateGuideLight);
}

function requestGuideUpdate() {
    if (guideAnimationFrame) return;
    if (guideFrameRequested) return;

    guideFrameRequested = true;
    requestAnimationFrame(() => {
        updateGuideLight();
        guideFrameRequested = false;
    });
}

window.addEventListener("scroll", requestGuideUpdate, { passive: true });
window.addEventListener("resize", () => {
    buildGuideFireflySwarm();
    requestGuideUpdate();
});

buildGuideFireflySwarm();

window.addEventListener("load", () => {
    if (isReturningFromYumemori) {
        restoreCompletedJourney();
    } else {
        window.scrollTo(0, 0);
        requestGuideUpdate();
    }
});

window.addEventListener("pageshow", (event) => {
    if (event.persisted && sessionStorage.getItem("sivinaJourneyComplete") === "true") {
        restoreCompletedJourney();
    }
});

worldGate?.addEventListener("click", (event) => {
    event.preventDefault();

    const destination = worldGate.getAttribute("href") || "cottage.html";
    sessionStorage.setItem("sivinaJourneyComplete", "true");
    sessionStorage.setItem("forestAudioTime", "0");
    document.body.classList.add("leaving-for-cottage");

    if (!journeyMusic || journeyMusic.paused) {
        window.location.href = destination;
        return;
    }

    const startVolume = journeyMusic.volume;
    const fadeDuration = 1800;
    const startedAt = performance.now();

    function fadeJourneyMusic(now) {
        const progress = Math.min((now - startedAt) / fadeDuration, 1);
        journeyMusic.volume = startVolume * (1 - progress);

        if (progress < 1) {
            requestAnimationFrame(fadeJourneyMusic);
            return;
        }

        journeyMusic.pause();
        journeyMusic.currentTime = 0;
        journeyMusic.volume = startVolume;
        window.location.href = destination;
    }

    requestAnimationFrame(fadeJourneyMusic);
});

function returnToSivina(event) {
    event?.preventDefault();
    yumemoriView.hidden = true;
    sivinaHome.hidden = false;
    guideLight?.removeAttribute("hidden");
    document.body.classList.remove("viewing-yumemori");
    history.replaceState({}, "", "#threshold");
    requestAnimationFrame(() => {
        thresholdSection?.scrollIntoView({ behavior: "auto", block: "end" });
        requestGuideUpdate();
    });
}

yumemoriReturn?.addEventListener("click", returnToSivina);

window.addEventListener("popstate", () => {
    if (document.body.classList.contains("viewing-yumemori")) {
        returnToSivina();
    }
});

let journeyWasPlayingBeforeHidden = false;

function pauseJourneyForBackground() {
    if (!journeyMusic) return;
    journeyWasPlayingBeforeHidden = !journeyMusic.paused;
    journeyMusic.pause();
}

function resumeJourneyAfterBackground() {
    if (!journeyMusic || !journeyWasPlayingBeforeHidden) return;
    journeyWasPlayingBeforeHidden = false;
    journeyMusic.play().catch(() => {
        // A browser may require one fresh interaction after restoring a tab.
        const resume = () => journeyMusic.play().catch(() => {});
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
    });
}

// Pause while the visitor views another tab or webpage and resume at the same
// timestamp when they return. Do not rewind the soundtrack.
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pauseJourneyForBackground();
        if (guideAnimationFrame) cancelAnimationFrame(guideAnimationFrame);
        guideAnimationFrame = 0;
    } else {
        resumeJourneyAfterBackground();
        startGuideAnimation();
    }
});

window.addEventListener("pagehide", () => {
    journeyMusic?.pause();
});
