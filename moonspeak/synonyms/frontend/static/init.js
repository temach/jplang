function moonspeakConnect(document) {
    // examine the other iframe and if suitable return the name of the plugin to install there
    let firstInput = document.getElementsByTagName("input").item(0);
    if (firstInput.placeholder.toLowerCase().includes("keyword")) {
        return "synonyms_hacks_submit.js";
    }
}

var app = Elm.Main.init({
    node: document.getElementById("elm-app")
});

app.ports.sendMessage.subscribe(function(message) {
    // message from elm for javascript
    // broadcast it to top window
    // also: enforce same origin
    console.log(window.location + " posted:");
    message["info"] = "broadcast";
    console.log(message);
    if (window !== window.parent) {
        window.parent.postMessage(message, window.location.origin);
    }
});

// see: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
        // accept only messages for your domain
        // and drop self-messages
        return;
    }

    console.log(window.location + " received:");
    console.log(event.data);

    if (event.data["info"].includes("iframe connect")) {
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = event.data["pluginUrl"];
        document.body.appendChild(script);

    } else {
        app.ports.messageReceiver.send(event.data);
    }
});
