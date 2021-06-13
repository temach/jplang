import React, {Fragment, useState, useEffect} from 'react';

import {useSelector, useDispatch} from 'react-redux';
import {
    selectHistorySearch,
    getHistorySearches
} from './historySlice';

import styles from './History.module.css';

export function History() {
    const searches = useSelector(getHistorySearches)
    const dispatch = useDispatch();

    const reverse = (array) => {
        return array.map((item, idx) => array[array.length-1-idx])
    };

    return (
        <div className={styles.history}>
            <div className={styles.header_row}>
                Search history
            </div>
            {reverse(searches).map(
                (search, index) =>
                    <Fragment key={index}>
                        <div className={styles.row}
                             onClick={() => dispatch(selectHistorySearch(search))}
                        >
                            <span style={{flex: "0 0 2rem"}}>{(searches.length - 1 - index) + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>{search}</span>
                        </div>
                    </Fragment>
            )}
        </div>
    );
}
