function request_feature(feature_url) {
    let message = {
        "info": "please feature",
        "url": feature_url,
    }
    console.log(window.location + " posted:");
    console.log(message);
    if (window !== window.parent) {
        window.parent.postMessage(message, window.location.origin);
    }
}
