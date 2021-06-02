import {createSlice} from '@reduxjs/toolkit';

const cur_element = {
    "onyomi": "None",
    "keyword": "",
    "metadata": {
        "katakana": "None",
        "hiragana": "None",
        "notes": "",
    }
};

const initialState = {
    current: cur_element,
};

const submitBarSlice = createSlice({
    name: 'submitbar',
    initialState,
    reducers: {
        keywordInput: (state, action) => {
            state.current.keyword = action.payload;
        },
        notesInput: (state, action) => {
            state.current.metadata.notes = action.payload;
        },
    },
    extraReducers: {
        "workelements/selectWorkElement" : (state, action) => {
            state.current = action.payload;
        },
        "suggestions/selectSuggestion" : (state, action) => {
            state.current.keyword = action.payload;
        },
    },
});

export const {keywordInput, notesInput} = submitBarSlice.actions;

export const getCurrentElement = (state) => {
    return state.submitbar.current;
}

export default submitBarSlice.reducer;
