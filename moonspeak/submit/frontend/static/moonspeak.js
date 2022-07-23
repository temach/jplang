var _moonspeakIframePort = null;

function _moonspeakBuildOnPortMessageHandler(userHandler) {
    // we do a few housekeeping tasks and then call the user handler
    return (event) => {
        console.log(location + " received:");
        console.log(event.data);

        if ("info" in event.data && event.data["info"].includes("iframe connect")) {
            let script = document.createElement("script");
            script.type = "text/javascript";
            script.src = event.data["pluginUrl"];
            document.body.appendChild(script);
        };

        userHandler(event);
    }
}

function _moonspeakInternalHandler(event, userHandler) {
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

    console.log(location + " receiving once:");
    console.log(event.data);

    if (event.data["info"].includes("port")) {
        _moonspeakIframePort = event.ports[0];
        _moonspeakIframePort.onmessage = _moonspeakBuildOnPortMessageHandler(userHandler);
    } else {
        console.log("Can not understand message info:" + event.data["info"]);
        return;
    }
}

// use this function to subscribe to messages
function moonspeakInstallOnMessageHandler(userHandler) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
    // this listener is called ONCE to transfer the message channel for further communication
    window.addEventListener("message",
        (event) => _moonspeakInternalHandler(event, userHandler),
        {"once": true}
    );

}

// use this function to post messages
function moonspeakPostMessage(message) {
    console.log(location + " posted:");
    console.log(message);
    _moonspeakIframePort.postMessage(message);
}
