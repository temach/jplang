(function() {
let fileForBootstrapping = document.currentScript.src;
let script = document.createElement("script");
script.src = "../common/dev_mode/moonspeak_bootstrap.js";
script.onload = () => moonspeakBootstrap(fileForBootstrapping);
document.body.appendChild(script);
})();
