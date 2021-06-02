import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    currentOnyomi: "",
};

const suggestionsSlice = createSlice({
    name: 'suggestions',
    initialState,
    reducers: {
        selectSuggestion: (state, action) => {
        },
    },
    extraReducers: {
        "workelements/selectWorkElement" : (state, action) => {
            state.currentOnyomi = action.payload.onyomi;
        },
        "submitbar/keywordInput" : (state, action) => {
            state.currentOnyomi = action.payload;
        },
    },
});

export const {selectSuggestion} = suggestionsSlice.actions;

export const getCurrentOnyomi = (state) => {
    return state.suggestions.currentOnyomi;
}

export default suggestionsSlice.reducer;
