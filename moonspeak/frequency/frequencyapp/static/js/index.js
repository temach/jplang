import {initPitchZoom, moonspeakInstallOnMessageHandler, moonspeakPostMessage} from "./moonspeak.js";

// use moonspeakPostMessage when you want to send something
// moonspeakInstallOnMessageHandler(() => {}) when you want to receive something

function formatResponse(json) {
    const sortedJson = Object.fromEntries(
        Object.entries(json.frequency).sort((a, b) => b[1] - a[1])
    );
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";
    Object.keys(sortedJson).forEach((key) => {
        const row = document.createElement("tr");
        const kanjiCell = document.createElement("td");
        const frequencyCell = document.createElement("td");
        kanjiCell.textContent = key;
        frequencyCell.textContent = sortedJson[key];
        row.appendChild(kanjiCell);
        row.appendChild(frequencyCell);
        row.addEventListener("click", () => {
            const rowData = {
              kanji: key,
              frequency: sortedJson[key],
            };
            console.log("sending to parent: " + JSON.stringify(rowData));
            window.parent.postMessage(JSON.stringify(rowData), "*");
            row.classList.toggle("selected");
        });
        tableBody.appendChild(row);
    });
}

function submitUserInput() {
    const inputText = document.getElementById("input-text").value;
    const csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    fetch("submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({ usertext: inputText }),
    })
    .then((response) => response.json())
    .then((json) => formatResponse(json))
    .catch((error) => console.error(error));
}

function sendFile(file) {
    const uri = "submit";
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    const csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value;

    xhr.open("POST", uri, true);
    xhr.setRequestHeader("X-CSRFToken", csrftoken);
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const response_json = JSON.parse(xhr.response);
            formatResponse(response_json); // handle response.
        }
    };
    fd.append('binaryfile', file);
    // Initiate a multipart/form-data upload
    xhr.send(fd);
}

window.onload = () => {
    initPitchZoom();

    const text_button_elem = document.getElementById("submit_textinput");
    text_button_elem.onclick = () => {
        submitUserInput();
    }

    const dropzone = document.getElementById("dropzone");
    dropzone.ondragover = dropzone.ondragenter = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }
    dropzone.ondrop = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const filesArray = event.dataTransfer.files;
        for (let i=0; i<filesArray.length; i++) {
            sendFile(filesArray[i]);
        }
    }

    const input_elem = document.getElementById("input_binaryfile");
    const button_elem = document.getElementById("submit_binaryfile");
    button_elem.onclick = () => {
        input_elem.click();
    }
    input_elem.addEventListener("change", function() {
        sendFile(this.files[0]);
    });
}
