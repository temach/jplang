function request_feature(feature_url) {
    let message = {
        "feature_url": feature_url,
    }
    console.log("Sending message:");
    console.log(message);
    window.top.postMessage(message, window.top.location.origin);
}
