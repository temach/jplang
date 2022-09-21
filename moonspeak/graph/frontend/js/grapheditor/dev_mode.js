window.addEventListener("load", moonspeakDevMode, true);

function moonspeakDevMode() {
    // reset domain (sets port to null) to allow COMPLETE cross-domain iframe access while in dev mode
    document.domain = location.hostname;
}
