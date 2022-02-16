async function get_feature(feature_url, callback) {
    let backend = new URL("/api/getfeature", window.location);
    backend.searchParams.set('feature_url', new URL(feature_url));

    let response = await fetch(backend);
    if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
    }
    let feature_json = await response.json();
    return feature_json;
}

function append_feature(parent_elem, feature_url) {
    get_feature(feature_url).then(feature_json => {
        // dublicate requests is a known bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1464344
        let iframe = document.createElement("iframe");
        iframe.srcdoc = feature_json["text"];
        parent_elem.appendChild(iframe);
    }).catch(error => {
        console.log("HTTP error:" + error.message);
    });
}
