// An async request for data
export function fetchSuggestions(english_onyomi) {
    return fetch("/api/search/" + english_onyomi)
        .then(res => {
            console.log(res);
            return res.json();
        });
}

export function fetchSuggestionsPhonetics(english_onyomi) {
    return fetch("/api/search/phonetics/" + english_onyomi)
        .then(res => {
            console.log(res);
            return res.json();
        });
}

export function fetchSuggestionsVerbatim(english_onyomi) {
    return fetch("/api/search/verbatim/" + english_onyomi)
        .then(res => {
            console.log(res);
            return res.json();
        });
}