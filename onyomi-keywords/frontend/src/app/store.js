import {configureStore} from '@reduxjs/toolkit';
import workElementsReducer from '../features/workelements/workElementsSlice';
import submitBarReducer from "../features/submitbar/submitBarSlice";
import suggestionsReducer from "../features/suggestions/suggestionsSlice";


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
];

const test_suggestions = [
  {
    "keyword": "AKUpuncture",
    "metadata": {
      "corpus": 13,
      "subs": 10234,
    }
  },
  {
    "keyword": "AKUmulate",
    "metadata": {
      "corpus": 13,
      "subs": 10234,
    }
  },
  {
    "keyword": "AKUman",
    "metadata": {
      "corpus": 13,
      "subs": 10234,
    }
  },
];
/*
const initialState = {
  suggestions: test_suggestions,
  elements: test_elems,
  selectedIndex: 0,
  current: this.elements[0],
}*/

export const store = configureStore({
    reducer: {
        workelements: workElementsReducer,
        submitbar: submitBarReducer,
        suggestions: suggestionsReducer,
    },
});
