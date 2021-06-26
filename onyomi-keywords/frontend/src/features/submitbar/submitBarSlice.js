import {createSlice} from '@reduxjs/toolkit';

const submitBarSlice = createSlice({
    name: 'submitbar',
    initialState: {},
    reducers: {
        keywordInput: (state, action) => {
            state.current.keyword = action.payload;
        },
        notesInput: (state, action) => {
            state.current.metadata.notes = action.payload;
        },
        submitKeywordReady: (state, action) => {
        },
        downsyncFromAnkiReady: (state, action) => {
        }
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

export const {keywordInput, notesInput, submitKeywordReady, downsyncFromAnkiReady} = submitBarSlice.actions;

export const getCurrentElement = (state) => {
    return state.submitbar.current;
}

export default submitBarSlice.reducer;