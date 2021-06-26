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
            if (index + 1 < state.elements.length) {
                state.force = index + 1;
            } else {
                state.force = 0;
            }
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

export const forceSelectElement = (state) => {
    return state.workelements.force;
}

export default workElementsSlice.reducer;
