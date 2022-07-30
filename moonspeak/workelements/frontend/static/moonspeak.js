let _moonspeakPorts = [];

function _moonspeakLog(msg, obj) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Console/log#logging_objects
    console.log(location + " " + document.title + " " + msg);
    console.log(JSON.parse(JSON.stringify(obj)));
}

function _moonspeakMessageHandler(event, userHandler) {
    // if ("info" in event.data && event.data["info"].includes("install plugin")) {
    //     let script = document.createElement("script");
    //     script.type = "text/javascript";
    //     script.src = event.data["pluginUrl"];
    //     document.head.appendChild(script);
    // } else if ("info" in event.data && event.data["info"].includes("iframe connect")) {
    //     peerport = event.ports[0];
    //     peerport.onmessage = (event) => _moonspeakMessageHandler(event, userHandler);
    //     _moonspeakPorts.push(peerport);
    // } else if ("info" in event.data) {
    //     console.log("Can not understand message info:" + event.data["info"]);
    //     return;
    // };

    _moonspeakLog("received:", event.data);
    userHandler(event);
}

function _moonspeakBootstrapMasterPort(event, userHandler) {
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

    _moonspeakLog("receiving once:", event.data);

    if (event.data["info"].includes("port")) {
        masterport = event.ports[0];
        masterport.onmessage = (event) => _moonspeakMessageHandler(event, userHandler);
        _moonspeakPorts.push(masterport);
    } else {
        _moonspeakLog("Can not understand message info:", event.data["info"]);
        return;
    }
}

// use this function to subscribe to messages
function moonspeakInstallOnMessageHandler(userHandler) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // this listener is called ONCE to transfer the message channel for further communication
    window.addEventListener("message",
        (event) => _moonspeakBootstrapMasterPort(event, userHandler),
        {"once": true}
    );
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
    _moonspeakLog("posted:", message);
    for (const port of _moonspeakPorts) {
        port.postMessage(message);
    }
}
