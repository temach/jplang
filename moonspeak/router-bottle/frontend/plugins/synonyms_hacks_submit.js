// this is run in another window's context
// the code installs a new fountain of events
(function() {

    function observeAllValueChanges(element) {
        // basically a listener that only caches javascript setting the value
        // see: https://stackoverflow.com/questions/42427606/event-when-input-value-is-changed-by-javascript
        var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        var originalSet = descriptor.set;

        // define our own setter
        descriptor.set = function(val) {
            originalSet.apply(this,arguments);
            messagePusher();
        }

        Object.defineProperty(element, "value", descriptor);
    }


    // observe this element...
    let firstInput = document.getElementsByTagName("input").item(0);

    // ...by running this function...
    let messagePusher = () => {
        let message = {
            "keyword": firstInput.value,
        };
        console.log(window.location + " posted:");
        message["info"] = "broadcast";
        console.log(message);
        if (window !== window.parent) {
            window.parent.postMessage(message, window.location.origin);
        }
    };

    // ...when this events happens
    observeAllValueChanges(firstInput);
    firstInput.addEventListener("input", messagePusher);

}());
