const forestAudio = document.getElementById("forestAudio");
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

const totalPages = 9;
let currentPage = 1;
let isTurning = false;
let touchStartX = null;

function fadeAudio(audio, from, to, duration) {
    if (!audio) return;
    const startedAt = performance.now();
    audio.volume = from;

    function step(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = progress * progress * (3 - 2 * progress);
        audio.volume = from + (to - from) * eased;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function startForest() {
    if (!forestAudio) return;
    forestAudio.volume = 0;
    const savedTime = Number(sessionStorage.getItem("forestAudioTime"));
    if (Number.isFinite(savedTime) && savedTime > 0) forestAudio.currentTime = savedTime;

    const play = () => {
        forestAudio.play()
            .then(() => fadeAudio(forestAudio, 0, 0.34, 4200))
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
    window.setTimeout(() => journalClose?.focus(), 900);
}

function closeJournal() {
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
});
