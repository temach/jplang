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
