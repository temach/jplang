// this is run in another window's context
(function() {

    // observe this element...
    let firstInput = document.getElementsByTagName("input").item(0);

    // ...by running this function...
    let messagePusher = () => {
        let message = {
            "keyword": firstInput.value,
            "typing": true,
        };
        console.log(window.location + " posted:");
        message["info"] = "broadcast";
        console.log(message);
        if (window !== window.parent) {
            window.parent.postMessage(message, window.location.origin);
        }
    };

    // ...when this event happens
    firstInput.addEventListener("input", messagePusher);

}());
