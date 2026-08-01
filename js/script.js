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

const returnParams = new URLSearchParams(window.location.search);
const isReturningFromYumemori =
    returnParams.get("return") === "1" ||
    sessionStorage.getItem("sivinaJourneyComplete") === "true";

function restoreCompletedJourney() {
    if (!isReturningFromYumemori) return;

    journeyHasBegun = true;
    document.body.classList.remove("journey-locked");
    document.body.classList.add("journey-started", "journey-restored");
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
    document.body.classList.add("journey-started");
    guideLight?.classList.add("is-arriving");
    updateGuideLight();

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

    for (let index = 0; index < waypoints.length - 1; index += 1) {
        if (progress >= waypoints[index].progress && progress <= waypoints[index + 1].progress) {
            start = waypoints[index];
            end = waypoints[index + 1];
            break;
        }
    }

    const range = Math.max(end.progress - start.progress, 0.001);
    const localProgress = smoothStep((progress - start.progress) / range);
    const x = mix(start.x, end.x, localProgress);
    const y = mix(start.y, end.y, localProgress);
    const opacity = mix(start.opacity, end.opacity, localProgress);
    const scale = mix(start.scale, end.scale, localProgress);

    guideLight.style.setProperty("--guide-x", `${x}px`);
    guideLight.style.setProperty("--guide-y", `${y}px`);
    guideLight.style.setProperty("--guide-opacity", opacity.toFixed(3));
    guideLight.style.setProperty("--guide-scale", scale.toFixed(3));

    if (worldGate) {
        worldGate.classList.toggle("is-awake", progress >= 0.955);
    }
}

let guideFrameRequested = false;

function requestGuideUpdate() {
    if (guideFrameRequested) return;

    guideFrameRequested = true;
    requestAnimationFrame(() => {
        updateGuideLight();
        guideFrameRequested = false;
    });
}

window.addEventListener("scroll", requestGuideUpdate, { passive: true });
window.addEventListener("resize", requestGuideUpdate);

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
    if (document.hidden) pauseJourneyForBackground();
    else resumeJourneyAfterBackground();
});

window.addEventListener("pagehide", () => {
    journeyMusic?.pause();
});
