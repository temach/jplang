// An async request for data
export function fetchSuggestions(english_onyomi) {
    return fetch("/api/search/" + encodeURIComponent(english_onyomi))
        .then(res => {
            return res.json();
        });
}

export function fetchSuggestionsPhonetics(english_onyomi) {
    return fetch("/api/search/phonetics/" + encodeURIComponent(english_onyomi))
        .then(res => {
            return res.json();
        });
}

export function fetchSuggestionsVerbatim(english_onyomi) {
    return fetch("/api/search/verbatim/" + encodeURIComponent(english_onyomi))
        .then(res => {
            return res.json();
        });
}