function workelementsInit() {
    var app = Elm.Main.init({
        node: document.getElementById("elm-app")
    });

    app.ports.sendMessage.subscribe(function(message) {
        moonspeakPostMessage(message);
    });


    function onMessage(event) {
        app.ports.messageReceiver.send(event.data);
    }

    moonspeakInstallOnMessageHandler(onMessage);
}

if (typeof Elm !== "undefined") {
    workelementsInit();
} else {
    // if Elm has not loaded yet, try again in one second
    window.setTimeout(() => workelementsInit(), 1000);
}
