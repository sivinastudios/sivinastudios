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
let spiritAudioWasPlayingBeforeHidden = false;

function beginReveal() {
    if (revealStarted) return;
    revealStarted = true;
    firstView.classList.add('is-attentive');
    window.setTimeout(() => firstView.classList.add('is-revealing'), 850);
}

function beginAudio() {
    if (!spiritAudio || document.hidden) return;
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
    referencePanel.classList.remove('is-open');
    referencePanel.setAttribute('aria-hidden', 'true');
}
panelClose?.addEventListener('click', closePanel);
referencePanel?.addEventListener('click', (event) => {
    if (event.target === referencePanel) closePanel();
});
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanel();
});

window.addEventListener('load', () => {
    // The journal click generally gives the browser enough user intent to permit sound.
    // A visible fallback remains available if autoplay is blocked.
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
