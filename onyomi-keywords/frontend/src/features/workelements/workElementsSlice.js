import {createSlice} from '@reduxjs/toolkit';

const workElementsSlice = createSlice({
    name: 'workelements',
    initialState: {},
    reducers: {
        selectWorkElement: (state, action) => {
        },
        setWorkElements: (state, action) => {
            state.elements = action.payload;
        },
    },
    extraReducers: {
        "submitbar/submitKeywordReady": (state, action) => {
            const index = state.elements.findIndex(e => e.onyomi === action.payload.onyomi);
            state.elements[index] = action.payload;
        },
        "submitbar/downsyncFromAnkiReady": (state, action) => {
            // empty elements and trigger re-paint
            state.elements = [];
        },
    }
});

export const {selectWorkElement, setWorkElements} = workElementsSlice.actions;

export const getCurrentWorkElements = (state) => {
    return state.workelements.elements;
}

export default workElementsSlice.reducer;
