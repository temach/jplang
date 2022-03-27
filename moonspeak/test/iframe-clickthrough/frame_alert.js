alert('Alert script executing');
console.log(document);
console.log(appRootElement);
document.getElementById('alert_button').addEventListener('click', (e) => {
     alert("Hello! This is an alert box");
});
