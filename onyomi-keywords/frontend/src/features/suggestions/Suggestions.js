import React, {useState, useEffect, Fragment} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {selectSuggestion, searchDone, getCurrentOnyomi} from "./suggestionsSlice";

import styles from './Suggestions.module.css';

import {
    fetchSuggestionsRegex,
} from "./suggestionsAPI";

export function Suggestions() {
    const onyomi = useSelector(getCurrentOnyomi);
    const dispatch = useDispatch();

    const [suggestions, setSuggestions] = useState([]);
    const [search, setSearch] = useState(onyomi);

    const isValidRegex = (text) => {
        try {
            new RegExp(text);
            return true;
        } catch(e) {
            return false;
        }
    };

    const updateSuggestions = (text) => {
        if (! isValidRegex(text)) {
            return;
        }
        fetchSuggestionsRegex(text).then(
            (result) => {
                if (result.length > 0) {
                    dispatch(searchDone(text));
                }
                return setSuggestions(result);
            },
            (error) => {
                console.log(error);
            }
        );
    }

    useEffect(() => {
        updateSuggestions(search);
    }, [search]);

    useEffect(() => {
        setSearch(onyomi);
    }, [onyomi]);

    return (
        <Fragment>
            <div className={styles.suggestions}>
                <div className={styles.header_row}>
                    <span style={{flex: "1 0"}}>
                        Phonetics (<a href={"http://www.speech.cs.cmu.edu/cgi-bin/cmudict/"}>Phonemes</a>)
                    </span>
                    <input style={{flex: "3 0"}}
                           type={"text"}
                           value={search}
                           onChange={event => setSearch(event.target.value)}
                           placeholder={"avatar or G.?.? A.?.? [^TKN]"}
                    />
                </div>
                {suggestions.map(
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
