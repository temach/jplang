// An async request for data
export function fetchSuggestionsRegex(english_onyomi) {
    return fetch("/api/search/regex/" + encodeURIComponent(english_onyomi))
        .then(res => {
            return res.json();
        });
}