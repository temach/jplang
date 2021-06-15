import React, {useState, useEffect} from 'react';

import {useSelector, useDispatch} from 'react-redux';
import {
    getCurrentElement,
    keywordInput,
    notesInput,
    submitKeywordReady,
    downsyncFromAnkiReady,
} from './submitBarSlice';

import styles from './SubmitBar.module.css';
import {fetchKeywordFreq, submitKeyword, submitKeywordToAnki, downsyncAllKeywordsFromAnki} from "./submitBarAPI";

export function SubmitBar() {
    const element = useSelector(getCurrentElement);
    const dispatch = useDispatch();

    const [message, setMessage] = useState(null);
    const [freqCorpus, setFreqCorpus] = useState(99999);
    const [freqSubs, setFreqSubs] = useState(99999);

    const getKeywordFreq =
        () => fetchKeywordFreq(element.keyword).then(
            (result) => {
                setFreqCorpus(result.freq.corpus);
                setFreqSubs(result.freq.subs);
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.log(error);
            }
        );

    const postKeyword =
        () => submitKeyword(element).then(
            (result) => {
                if (result.ok) {
                    dispatch(submitKeywordReady(element));
                } else {
                    result.text().then((msg) => setMessage(msg));
                }
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.log(error);
            }
        );

    const upsyncKeywordToAnki =
        () => submitKeywordToAnki(element).then(
            (result) => {
                if (result.ok) {
                    dispatch(submitKeywordReady(element));
                } else {
                    result.text().then((msg) => setMessage(msg));
                }
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.log(error);
            }
        );

    const downsyncAllKeywords =
        () => downsyncAllKeywordsFromAnki().then(
            (result) => {
                if (result.ok) {
                    dispatch(downsyncFromAnkiReady);
                } else {
                    result.text().then((msg) => setMessage(msg));
                }
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.log(error);
            }
        );

    useEffect(() => {getKeywordFreq()}, [element.keyword]);

    return (
        <div className={styles.submitbar}>
            {message && (
                <div className={styles.row}>
                    {message}
                </div>
            )}

            <div className={styles.row}>
                <span style={{flex: "0 0 3rem"}}>
                    {element.onyomi}
                </span>

                <span style={{flex: "0 0 4rem"}}>
                    {element.metadata.katakana}
                </span>

                <span style={{flex: "0 0 4rem"}}>
                    {element.metadata.hiragana}
                </span>

                <input style={{flex: "1 0"}}
                       type={"text"}
                       value={element.keyword}
                       onChange={event => dispatch(keywordInput(event.target.value))}
                       placeholder={"Keyword"}
                />

                <span style={{flex: "0 0 9rem"}}>
                    {"Corpus:" + freqCorpus}
                </span>

                <span style={{flex: "0 0 9rem"}}>
                    {"Subs:" + freqSubs}
                </span>

                <input style={{flex: "0 0"}}
                       type={"button"}
                       value={"Submit"}
                       onClick={postKeyword}
                />

                <input style={{flex: "0 0"}}
                       type={"button"}
                       value={"Upsync Anki"}
                       onClick={upsyncKeywordToAnki}
                />

                <input style={{flex: "0 0"}}
                       type={"button"}
                       value={"Downsync Anki"}
                       onClick={downsyncAllKeywords}
                />

                <input style={{flex: "1 1"}}
                       type={"text"}
                       value={element.metadata.notes}
                       onChange={event => dispatch(notesInput(event.target.value))}
                       placeholder={"Notes"}
                />
            </div>
        </div>
    );
}
