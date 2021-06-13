// An async request for data
export function fetchWorkElements() {
    return fetch("/api/work")
        .then(res => {
            return res.json();
        });
}
