function request_feature(feature_url) {
    let message = {
        "info": "new feature",
        "url": feature_url,
    }
    console.log("plus posted:");
    console.log(message);
    window.parent.postMessage(message, window.top.location.origin);
}
