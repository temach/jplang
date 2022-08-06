let moonspeakPorts = [];

function moonspeakLog(msg, obj) {
    console.log(location + " " + document.title + " " + msg);
    if (obj) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/Console/log#logging_objects
        console.log(JSON.parse(JSON.stringify(obj)));
    }
}

function moonspeakMessageHandler(event, userHandler) {
    moonspeakLog("received:", event.data);
    userHandler(event);
}

function moonspeakBootstrapMasterPort(event, userHandler) {
    function isMoonspeakDevMode(hostname = location.hostname) {
        // checking .endsWith() is ok, but .startsWith() is not ok
        return (
            ['localhost', '127.0.0.1', '', '0.0.0.0', '::1'].includes(hostname)
            || hostname.endsWith('.local')
            || hostname.endsWith('.test')
        )
    }

    if (event.origin !== location.origin && !isMoonspeakDevMode()) {
        // accept only messages from same origin, but ignore this rule for dev mode
        return;
    }

    moonspeakLog("receiving once:", event.data);

    if ("info" in event.data && event.data["info"].includes("port")) {
        masterport = event.ports[0];
        masterport.onmessage = (event) => moonspeakMessageHandler(event, userHandler);
        moonspeakPorts.push(masterport);
        return;
    }

    moonspeakLog("Can not understand message info, handling anyway.");
    moonspeakMessageHandler(event, userHandler);
}

// use this function to subscribe to messages
function moonspeakInstallOnMessageHandler(userHandler) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // this listener is called ONCE to transfer the message channel for further communication
    window.addEventListener("message", (event) => moonspeakBootstrapMasterPort(event, userHandler));
}

// use this function to post messages
function moonspeakPostMessage(message, isSecondTime=false) {
    if (_moonspeakPorts.length === 0) {
        if (isSecondTime === false) {
            // if sending this message first time, try repeating it after few milli-seconds
            // if it fails a second time, then ignore
            window.setTimeout(() => moonspeakPostMessage(message, true), 500);
        }

        // if no ports listening, nothing to do
        return;
    }
    moonspeakLog("posted:", message);
    for (const port of moonspeakPorts) {
        port.postMessage(message);
    }
}

export { moonspeakInstallOnMessageHandler, moonspeakPostMessage };
