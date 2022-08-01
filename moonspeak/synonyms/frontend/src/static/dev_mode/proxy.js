(function() {
    const httpRequest = new XMLHttpRequest();

    // make a SYNC request, because this is dev_mode only and it works
    httpRequest.open('GET', "../static/dev_mode/fasttoml_handlebars_moonspeak_immediate.js", false);

    httpRequest.send();

    const script = document.createElement("script");
    script.innerHTML = httpRequest.responseText;

    // set custom data variable so bootstap script knows which file to bootstrap
    script.dataset.bootstrapFile = document.currentScript.src; 

    // insert new script immediately after current script
    document.currentScript.parentNode.insertBefore(script, document.currentScript.nextSibling);
})();
