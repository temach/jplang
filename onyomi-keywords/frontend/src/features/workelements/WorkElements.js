import React, {Fragment, useEffect} from 'react';

import {useSelector, useDispatch} from 'react-redux';
import {
    setWorkElements,
    getCurrentWorkElements,
    selectWorkElement,
    forceSelectElement
} from './workElementsSlice';

import styles from './WorkElements.module.css';

import {fetchWorkElements} from "./workElementsAPI";

export function WorkElements() {
    const force = useSelector(forceSelectElement);
    const workElements = useSelector(getCurrentWorkElements);
    const dispatch = useDispatch();

    const updateWorkElements =
        () => fetchWorkElements().then(
            (result) => {
                return dispatch(setWorkElements(result));
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.log(error);
            }
        );

    // Note: the empty deps array [] means this useEffect will run once
    useEffect(() => {updateWorkElements()},[]);

    useEffect(() => {
            if (workElements.length > 0) {
                dispatch(selectWorkElement(workElements[force]));
            }
        }, [force]);

    return (
        <div className={styles.workelements}>
            {workElements.map(
                (elem, index) =>
                    <Fragment key={index}>
                        {(index > 0)
                        && (
                            workElements[index-1].metadata.hiragana.charAt(0)
                            !== workElements[index].metadata.hiragana.charAt(0)
                        )
                        && <hr/>
                        }
                        <div className={styles.row}
                             onClick={() => dispatch(selectWorkElement(elem))}
                        >
                            <span style={{flex: "0 0 3rem"}}>{index + "."}</span>
                            <span style={{flex: "0 0 4rem"}}>{elem.onyomi}</span>
                            <span style={{flex: "1 0 6rem"}}>{elem.keyword}</span>
                            <span style={{flex: "3 0 5rem"}}>{elem.metadata.notes}</span>
                        </div>
                    </Fragment>
            )}
        </div>
    );
}
