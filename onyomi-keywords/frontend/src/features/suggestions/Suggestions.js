import React, {useState, useEffect, Fragment} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {selectSuggestion, getCurrentOnyomi} from "./suggestionsSlice";

import styles from './Suggestions.module.css';

import {fetchSuggestions, fetchSuggestionsPhonetics, fetchSuggestionsVerbatim} from "./suggestionsAPI";

export function Suggestions() {
    const onyomi = useSelector(getCurrentOnyomi);
    const dispatch = useDispatch();

    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsPhonetics, setSuggestionsPhonetics] = useState([]);
    const [suggestionsVerbatim, setSuggestionsVerbatim] = useState([]);
    const [searchPhonetics, setSearchPhonetics] = useState("");

    const updateSuggestions =
        (text) => fetchSuggestions(text).then(
            (result) => {
                return setSuggestions(result);
            },
            (error) => {
                console.log(error);
            }
        );

    const updateSuggestionsPhonetics =
        (text) => fetchSuggestionsPhonetics(text).then(
            (result) => {
                return setSuggestionsPhonetics(result);
            },
            (error) => {
                console.log(error);
            }
        );

    const updateSuggestionsVerbatim =
        (text) => fetchSuggestionsVerbatim(text).then(
            (result) => {
                return setSuggestionsVerbatim(result);
            },
            (error) => {
                console.log(error);
            }
        );

    useEffect(() => updateSuggestionsPhonetics(searchPhonetics), [searchPhonetics]);

    useEffect(() => {
        updateSuggestions(onyomi);
        updateSuggestionsVerbatim(onyomi);
    }, [onyomi]);

    return (
        <Fragment>
            <div className={styles.sugggestions_spelling}>
                <div className={styles.header_row}>
                    Suggestions
                </div>
                {suggestions.map(
                    (elem, index) =>
                        <div className={styles.row} key={index}
                             onClick={() => dispatch(selectSuggestion(elem.keyword))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.keyword}</span>
                        </div>
                )}
            </div>
            <div className={styles.suggestions_verbatim}>
                <div className={styles.header_row}>
                    <span style={{flex: "1 0"}}>
                        Spelling: {onyomi}
                    </span>
                    <a href={"http://www.speech.cs.cmu.edu/cgi-bin/cmudict/"} style={{flex: "0 0 6rem"}}>
                        Phoneme set
                    </a>
                </div>
                {suggestionsVerbatim.map(
                    (elem, index) =>
                        <div className={styles.row} key={index}
                             onClick={() => dispatch(selectSuggestion(elem.keyword))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.keyword}</span>
                            <span style={{flex: "2 1 3rem"}}>{elem.metadata.phonetics}</span>
                        </div>
                )}
            </div>
            <div className={styles.suggestions_phonetic}>
                <div className={styles.header_row}>
                    <span style={{flex: "1 0"}}>
                        Phonetics
                    </span>
                    <input style={{flex: "3 0"}}
                           type={"text"}
                           value={searchPhonetics}
                           onChange={event => setSearchPhonetics(event.target.value)}
                           placeholder={"B A CH I"}
                    />
                    <a href={"http://www.speech.cs.cmu.edu/cgi-bin/cmudict/"} style={{flex: "0 0 6rem"}}>
                        Phoneme set
                    </a>
                </div>
                {suggestionsPhonetics.map(
                    (elem, index) =>
                        <div className={styles.row} key={index}
                             onClick={() => dispatch(selectSuggestion(elem.keyword))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{elem.keyword}</span>
                            <span style={{flex: "2 1 3rem"}}>{elem.metadata.phonetics}</span>
                        </div>
                )}
            </div>
        </Fragment>
    );
}
