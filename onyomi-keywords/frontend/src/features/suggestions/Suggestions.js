import React, {useState, useEffect, Fragment} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {selectSuggestion, getCurrentOnyomi} from "./suggestionsSlice";

import styles from './Suggestions.module.css';

import {fetchSuggestions, fetchSuggestionsPhonetics, fetchSuggestionsVerbatim} from "./suggestionsAPI";

const test_suggestions = [
    {
        "keyword": "AKUpuncture",
        "metadata": {
            "corpus": 13,
            "subs": 10234,
            "phonetics": "",
        }
    },
    {
        "keyword": "AKUman",
        "metadata": {
            "corpus": 13,
            "subs": 10234,
            "phonetics": "",
        }
    },
];

export function Suggestions() {
    const onyomi = useSelector(getCurrentOnyomi);
    const dispatch = useDispatch();

    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsPhonetics, setSuggestionsPhonetics] = useState([]);
    const [suggestionsVerbatim, setSuggestionsVerbatim] = useState([]);

    
    const updateSuggestions =
        () => fetchSuggestions(onyomi).then(
            (result) => {
                return setSuggestions(result);
            },
            (error) => {
                console.log(error);
            }
        );

    const updateSuggestionsPhonetics =
        () => fetchSuggestionsPhonetics(onyomi).then(
            (result) => {
                return setSuggestionsPhonetics(result);
            },
            (error) => {
                console.log(error);
            }
        );

    const updateSuggestionsVerbatim =
        () => fetchSuggestionsVerbatim(onyomi).then(
            (result) => {
                return setSuggestionsVerbatim(result);
            },
            (error) => {
                console.log(error);
            }
        );

    useEffect(() => {
        updateSuggestions();
        updateSuggestionsPhonetics();
        updateSuggestionsVerbatim();
    }, [onyomi]);

    return (
        <Fragment>
            <div className={styles.sugggestions_spelling}>
                <div className={styles.header_row}>
                    <span style={{flex: "1 0"}}>Suggestions</span>
                    <span style={{flex: "0 0 4rem"}}>Corpus</span>
                    <span style={{flex: "0 0 4rem"}}>Subs</span>
                </div>
                {suggestions.map(
                    (elem, index) =>
                        <div className={styles.row} key={index}
                             onClick={() => dispatch(selectSuggestion(elem.keyword))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.keyword}</span>
                            <span style={{flex: "0 0 4rem"}}>{elem.metadata.corpus}</span>
                            <span style={{flex: "0 0 4rem"}}>{elem.metadata.subs}</span>
                        </div>
                )}
            </div>
            <div className={styles.suggestions_phonetic}>
                <div className={styles.header_row}>
                    <span style={{flex: "1 0"}}>Suggestions (phonetics)</span>
                    <a href={"http://www.speech.cs.cmu.edu/cgi-bin/cmudict/"} style={{flex: "0 0 6rem"}}>Phoneme set</a>
                </div>
                {suggestionsPhonetics.map(
                    (elem, index) =>
                        <div className={styles.row} key={index}
                             onClick={() => dispatch(selectSuggestion(elem.keyword))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.keyword}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.metadata.phonetics}</span>
                        </div>
                )}
            </div>
            <div className={styles.suggestions_verbatim}>
                <div className={styles.header_row}>
                    <span style={{flex: "1 0"}}>Suggestions (verbatim)</span>
                    <span style={{flex: "0 0 4rem"}}>Corpus</span>
                    <span style={{flex: "0 0 4rem"}}>Subs</span>
                </div>
                {suggestionsVerbatim.map(
                    (elem, index) =>
                        <div className={styles.row} key={index}
                             onClick={() => dispatch(selectSuggestion(elem.keyword))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.keyword}</span>
                            <span style={{flex: "0 0 4rem"}}>{elem.metadata.corpus}</span>
                            <span style={{flex: "0 0 4rem"}}>{elem.metadata.subs}</span>
                        </div>
                )}
            </div>
        </Fragment>
    );
}
