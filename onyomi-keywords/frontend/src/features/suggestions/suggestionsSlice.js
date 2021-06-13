import {createSlice} from '@reduxjs/toolkit';

const suggestionsSlice = createSlice({
    name: 'suggestions',
    initialState: {},
    reducers: {
        selectSuggestion: (state, action) => {
        },
        searchDone: (state, action) => {
        }
    },
    extraReducers: {
        "workelements/selectWorkElement" : (state, action) => {
            state.currentOnyomi = action.payload.onyomi;
        },
        "submitbar/keywordInput" : (state, action) => {
            state.currentOnyomi = action.payload;
        },
        "history/selectHistorySearch": (state, action) => {
            state.currentOnyomi = action.payload;
        },
    },
});

export const {selectSuggestion, searchDone} = suggestionsSlice.actions;

export const getCurrentOnyomi = (state) => {
    return state.suggestions.currentOnyomi;
}

export default suggestionsSlice.reducer;
