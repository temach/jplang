import workElementsReducer, {
  setWorkElements,
  getCurrentWorkElements,
  setSelectedIndex,
  getCurrentIndex,
} from './submitBarSlice';

describe('work elements reducer', () => {

  const test_elems = [
    {
      "english": 'a',
      "katakana": 'ア',
      "hiragana": 'あ',
      "keyword": 'Avatar',
    },
    {
      "english": 'ai',
      "katakana": 'アイ',
      "hiragana": 'あい',
      "keyword": 'AIsle / AIming',
    },
    {
      "english": 'aku',
      "katakana": 'アク',
      "hiragana": 'あく',
      "keyword": 'AKUpuncture',
    },
    {
      "english": 'an',
      "katakana": 'アン',
      "hiragana": 'あん',
      "keyword": 'ANomaly / ANN Coulter',
    },
    {
      "english": 'atsu',
      "katakana": 'アツ',
      "hiragana": 'あつ',
      "keyword": 'ATHletic',
    },
    {
      "english": 'ba',
      "katakana": 'バ',
      "hiragana": 'ば',
      "keyword": 'BAzaar',
    },
  ];

  const initialState = {
    elements: [],
    selectedIndex: 0,
  };

  it('should handle initial state', () => {
    expect(workElementsReducer(undefined, { type: 'unknown' })).toEqual({
      elements: [],
      selectedIndex: 0,
    });
  });

  it('should handle setting elements', () => {
    const actual = workElementsReducer(initialState, setWorkElements(test_elems));
    expect(actual.elements).toEqual(test_elems);
  });

  it('should handle emptying elements', () => {
    const actual = workElementsReducer(initialState, setWorkElements([]));
    expect(actual.elements).toEqual([]);
  });

  it('should handle selecting index', () => {
    const actual = workElementsReducer(initialState, setSelectedIndex(10));
    expect(actual.selectedIndex).toEqual(10);
  });
});
