import {createSlice} from '@reduxjs/toolkit';

const test_elems = [
    {
        "onyomi": 'a',
        "keyword": 'Avatar',
        "metadata": {
            "katakana": 'ア',
            "hiragana": 'あ',
            "notes": ""
        }
    },
    {
        "onyomi": 'ai',
        "keyword": 'AIsle / AIming',
        "metadata": {
            "katakana": 'アイ',
            "hiragana": 'あい',
            "notes": ""
        }
    },
    {
        "onyomi": 'aku',
        "keyword": 'AKUpuncture',
        "metadata": {
            "katakana": 'アク',
            "hiragana": 'あく',
            "notes": ""
        }
    },
    {
        "onyomi": 'an',
        "keyword": 'ANomaly / ANN Coulter',
        "metadata": {
            "katakana": 'アン',
            "hiragana": 'あん',
            "notes": ""
        }
    },
    {
        "onyomi": 'atsu',
        "katakana": 'アツ',
        "metadata": {
            "hiragana": 'あつ',
            "keyword": 'ATHletic',
            "notes": ""
        }
    },
    {
        "onyomi": 'ba',
        "keyword": 'BAzaar',
        "metadata": {
            "katakana": 'バ',
            "hiragana": 'ば',
            "notes": ""
        }
    },
]

const initialState = {
    elements: test_elems,
    selectedIndex: 0,
};

const workElementsSlice = createSlice({
    name: 'workelements',
    initialState,
    reducers: {
        selectWorkElement: (state, action) => {
        },
        setWorkElements: (state, action) => {
            state.elements = action.payload;
        },
    },
});

export const {selectWorkElement, setWorkElements} = workElementsSlice.actions;

export const getCurrentWorkElements = (state) => {
    return state.workelements.elements;
}

export default workElementsSlice.reducer;
