const firstView = document.getElementById('firstView');
const spiritAudio = document.getElementById('spiritAudio');
const audioPrompt = document.getElementById('audioPrompt');
const beginSound = document.getElementById('beginSound');
const referencePanel = document.getElementById('referencePanel');
const documentPanel = document.getElementById('documentPanel');
const conceptPanel = document.getElementById('conceptPanel');
const panelClose = document.getElementById('panelClose');

// The upward reveal is synchronized to the chosen musical cue.
const REVEAL_CUE_SECONDS = 10.4;
let revealStarted = false;
let revealFallbackTimer = null;
let spiritAudioWasPlayingBeforeHidden = false;
let panelTrigger = null;

function beginReveal() {
    if (revealStarted) return;
    revealStarted = true;
    if (revealFallbackTimer) window.clearTimeout(revealFallbackTimer);
    firstView.classList.add('is-attentive');
    window.setTimeout(() => firstView.classList.add('is-revealing'), 850);
}

function scheduleRevealFallback(delaySeconds = REVEAL_CUE_SECONDS) {
    if (revealStarted || revealFallbackTimer) return;
    revealFallbackTimer = window.setTimeout(beginReveal, delaySeconds * 1000);
}

function beginAudio() {
    if (document.hidden) return;
    scheduleRevealFallback();
    if (!spiritAudio) return;
    spiritAudio.volume = 0.72;
    spiritAudio.loop = true;
    spiritAudio.play().then(() => {
        audioPrompt.hidden = true;
    }).catch(() => {
        audioPrompt.hidden = false;
    });
}

spiritAudio?.addEventListener('timeupdate', () => {
    if (spiritAudio.currentTime >= REVEAL_CUE_SECONDS) beginReveal();
});

spiritAudio?.addEventListener('ended', () => {
    if (!revealStarted) beginReveal();
});

beginSound?.addEventListener('click', beginAudio);

function openPanel(kind) {
    panelTrigger = document.activeElement;
    documentPanel.hidden = kind !== 'document';
    conceptPanel.hidden = kind !== 'concept';
    referencePanel.classList.add('is-open');
    referencePanel.setAttribute('aria-hidden', 'false');
    panelClose.focus();
}

document.querySelectorAll('[data-panel]').forEach((button) => {
    button.addEventListener('click', () => openPanel(button.dataset.panel));
});

function closePanel() {
    if (referencePanel.getAttribute('aria-hidden') === 'true') return;
    referencePanel.classList.remove('is-open');
    referencePanel.setAttribute('aria-hidden', 'true');
    if (panelTrigger instanceof HTMLElement) panelTrigger.focus();
    panelTrigger = null;
}
panelClose?.addEventListener('click', closePanel);
referencePanel?.addEventListener('click', (event) => {
    if (event.target === referencePanel) closePanel();
});
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && referencePanel.getAttribute('aria-hidden') === 'false') closePanel();
});

window.addEventListener('load', () => {
    // Always preserve the ascent, even when the browser blocks autoplay.
    // If audio plays, the timeupdate cue remains the primary synchronization source.
    scheduleRevealFallback(REVEAL_CUE_SECONDS + 0.9);
    window.setTimeout(beginAudio, 900);
});

document.addEventListener('visibilitychange', () => {
    if (!spiritAudio) return;
    if (document.hidden) {
        spiritAudioWasPlayingBeforeHidden = !spiritAudio.paused;
        spiritAudio.pause();
        return;
    }
    if (!spiritAudioWasPlayingBeforeHidden) return;
    spiritAudioWasPlayingBeforeHidden = false;
    spiritAudio.play().catch(() => { audioPrompt.hidden = false; });
});

window.addEventListener('pagehide', () => spiritAudio?.pause());
