import { parseJson } from './json_parser'

describe('Parse JSON', () => {
  it('parses a string into an object', () => {
    const serialized = '{ "a": "a", "b": 1.1, "c": ["a", 1.1, {},null] }'
    expect(parseJson(serialized).getUnsafeSuccess())
      .toEqual({ a: 'a', b: 1.1, c: ['a', 1.1, {}, null] })
  })
})