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
            // empty the elements, this will trigger repaint and will request elements from backend again
            state.elements = [];
        },
    }
});

export const {selectWorkElement, setWorkElements} = workElementsSlice.actions;

export const getCurrentWorkElements = (state) => {
    return state.workelements.elements;
}

export default workElementsSlice.reducer;
