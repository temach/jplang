window.addEventListener("load", moonspeakDevMode, true);

function moonspeakDevMode() {
    // reset domain to allow cross-domain iframe access while in dev mode
    let temp = location.hostname.split('.').reverse();
    let root_domain = temp[1] + '.' + temp[0];
    document.domain = root_domain;
}
