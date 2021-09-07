import React, {Fragment, useState, useEffect} from 'react';

import {useSelector, useDispatch} from 'react-redux';
import {getSearchRules, submitSearchRules} from "./searchrulesAPI";


import styles from './SearchRules.module.css';

export function SearchRules() {

    const add_when_repurposed_letters_match_desc =
        <span>Repurpose english letters (since they remain unused):
            <ul>
                <li>C -> k</li>
                <li>L -> r</li>
                <li>Q -> k</li>
                <li>V -> i</li>
                <li>X -> z</li>
                <li>P -> unused</li>
            </ul>
            For example CATSlady = katsu and LICHking = richi
        </span>;

    const drop_when_unmatched_sound_pattern_desc =
        <span>Drop words that do not fullfill ou and yaku sounds.
            <ul>
                <li>The combination of english letters OW in the onyomi keyword represent "ou" japanese sound.
                    For example HOWling = hou
                </li>
                <li>The cobination of english letters UCK represent "yaku" japanese sound.
                    For example BUCKweed = byaku and RUCKsack = ryaku
                </li>
            </ul>
        </span>;

    const sort_by_word_length_desc =
        <span>
            Sort results by word length.
            Prolonged sounds are distinguished by longer words.
            For example KUmar = ku and KUbic-rubik = kuu
        </span>;

    const drop_when_certain_vowels_at_onyomi_end_desc =
        <span>
            Drop words that have certain LETTERS at onyomi end.
            These letters can be mistaken to be part of onyomi,
            as they appear as second/third/fourth letters in onyomi:
            [u, i, n, ku, ki, tsu, chi]
        </span>;

    const drop_when_certain_consonants_at_onyomi_end_desc =
        <span>
            Drop words that have certain SOUNDS at onyomi end.
            These sounds can be mistaken to be part of onyomi:
            [AA, AE, AH, AO, AW, AY, CH, EH, ER, EY, G, IH, IY, JH, K, N, NG, T, UH, UW, Y]
        </span>

    const rule2desc = {
        sort_by_word_length: sort_by_word_length_desc,
        add_when_repurposed_letters_match: add_when_repurposed_letters_match_desc,
        drop_when_unmatched_sound_pattern: drop_when_unmatched_sound_pattern_desc,
        drop_when_certain_vowels_at_onyomi_end: drop_when_certain_vowels_at_onyomi_end_desc,
        drop_when_certain_consonants_at_onyomi_end: drop_when_certain_consonants_at_onyomi_end_desc,
    };

    const INITIAL_RULES = {
        ...rule2desc,
    };
    Object.keys(rule2desc).forEach(rule_name => {
        INITIAL_RULES[rule_name] = false;
    });
    const [rules, setRules] = useState(INITIAL_RULES);

    const updateSearchRules =
        () => getSearchRules().then(
            (result) => {
                setRules(result);
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                console.log(error);
            }
        );

    useEffect(() => {updateSearchRules()},[]);

    const toggleRule = (rule_name) => {
        const prev_value = rules[rule_name];
        const new_rules = {
            ...rules,
            [rule_name]: ! prev_value,
        }
        setRules(new_rules);
        submitSearchRules(new_rules);
    }

    return (
        <div className={styles.history}>
            <div className={styles.header_row}>
                Search rules
            </div>
            {Object.keys(INITIAL_RULES).map(
                (rule_name, index) =>
                    <Fragment key={index}>
                        <div className={styles.row}
                             id={rule_name}
                             onClick={(event) => toggleRule(rule_name)}
                        >
                            <span style={{flex: "0 0 2rem"}}>{index + "."}</span>
                            <span style={{flex: "1 1 3rem"}}>
                                <input type="checkbox" checked={rules[rule_name]} />
                                {rule2desc[rule_name]}
                            </span>
                        </div>
                    </Fragment>
            )}
        </div>
    );
}
