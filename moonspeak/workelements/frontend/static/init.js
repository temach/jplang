var app = Elm.Main.init({
    node: document.getElementById("elm-app")
});

var graphPort = null;

function isMoonspeakDevMode(hostname = location.hostname) {
    // checking .endsWith() is ok, but .startsWith() is not ok
    return (
        ['localhost', '127.0.0.1', '', '0.0.0.0', '::1'].includes(hostname)
        || hostname.endsWith('.local')
        || hostname.endsWith('.test')
    )
}

app.ports.sendMessage.subscribe(function(message) {
    // message from elm for javascript
    // broadcast it to parent window
    // also: enforce same origin
    // and avoid self-messages
    console.log(location + " posted:");
    message["info"] = "broadcast";
    console.log(message);

    if (graphPort) {
        graphPort.postMessage(message);
    } else {
        console.log("Should buffer this: " + message);
    }
    // if (window !== window.parent) {
    //     // if host on dev origin, soften developer pain by relaxing security, else be strict
    //     let targetOrigin = isMoonspeakDevMode() ? "*" : location.origin;
    //     window.parent.postMessage(message, targetOrigin);
    // }
});

function onPortMessage(event) {
    console.log(location + " received:");
    console.log(event.data);

    if (event.data["info"].includes("iframe connect")) {
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = event.data["pluginUrl"];
        document.body.appendChild(script);
    } else {
        app.ports.messageReceiver.send(event.data);
    }
}

// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", (event) => {
    if (event.origin !== location.origin && !isMoonspeakDevMode()) {
        // accept only messages from same origin, but ignore this rule for dev mode
        return;
    }

    console.log(location + " received:");
    console.log(event.data);

    if (event.data["info"].includes("port")) {
        graphPort = event.ports[0];
        graphPort.onmessage = onPortMessage;
    } else {
        console.log("Can not understand message info:" + event.data["info"]);
        return;
    }
});
