// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener('message', onMessage);
window.addEventListener('load', initHud, true);


//=========================================================
// Managing fullscreen features that are loaded once at the start of app
const graphFrame = document.createElement('iframe');

async function initHud() {
    let response = await fetch('config/hud.json');

    if (! response.ok) {
        console.log('HTTP-Error: ' + response.status);
        return;
    }

    let json = await response.json();

    try {
        // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
        graphFrame.classList.add('fullscreen');
        graphFrame.src = json['graphurl'];
    } catch (error) {
        console.log('error creating graph iframe:' + error.message);
    };

    let container = document.getElementById('graphContainer');
    container.appendChild(graphFrame);
}


//=============================================================
// Messaging

function isMoonspeakDevMode(hostname = location.hostname) {
    // checking .endsWith() is ok, but .startsWith() is not ok
    return (
        ['localhost', '127.0.0.1', '', '0.0.0.0', '::1'].includes(hostname)
        || hostname.endsWith('.local')
        || hostname.endsWith('.test')
    )
}

function graphPostMessage(message) {
    // if host on dev origin, soften developer pain by relaxing security, else be strict
    let targetOrigin = this.isMoonspeakDevMode() ? '*' : location.origin;
    graphFrame.contentWindow.postMessage(message, targetOrigin);
}

function onMessage(event) {
    if (event.origin !== location.origin && !isMoonspeakDevMode()) {
        // accept only messages from same origin, but ignore this rule for dev mode
        return;
    }

    console.log(location + ' received:');
    console.log(event.data);

    if (! ('info' in event.data)) {
        console.log('No "info" field in message, skipping');
        return;
    }

    // right now hud does not receive any messages from graph
    console.log('Can not understand message info:' + event.data['info']);
    return;
}


