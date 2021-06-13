import {createSlice} from '@reduxjs/toolkit';

const historySlice = createSlice({
    name: 'history',
    initialState: {},
    reducers: {
        selectHistorySearch: (state, action) => {
        },
    },
    extraReducers: {
        "suggestions/searchDone": (state, action) => {
            let len = state.searches.length;

            if (action.payload.length < 2) {
                return;
            }

            if (len > 0) {
                let last = state.searches[len - 1];
                if (last === action.payload) {
                    return;
                }

                if (last + "." === action.payload
                    || last + "?" === action.payload) {
                    // to avoid visual clutter, do not add simple regex modifications ".?"
                    return;
                }
            }

            state.searches.push(action.payload);
        },
    }
});

export const {selectHistorySearch} = historySlice.actions;

export const getHistorySearches = (state) => {
    return state.history.searches;
}

export default historySlice.reducer;
