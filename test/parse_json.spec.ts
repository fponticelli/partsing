import { parseJson } from './json_parser'

describe('Parse JSON', () => {
  it('parse object', () => {
    const serialized = '{ "a": "a", "b": 1.1, "c": ["a", 1.1, {},null] }'
    expect(parseJson(serialized).getUnsafeSuccess())
      .toEqual({ a: 'a', b: 1.1, c: ['a', 1.1, {}, null] })
  })
})