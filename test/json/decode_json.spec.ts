import { decodeJson } from './json_decoder'

describe('Decode JSON', () => {
  it('decodes a string into an object', () => {
    const serialized = '{ "a": "a", "b": 1.1, "c": ["a", 1.1, {},null] }'
    expect(decodeJson(serialized).getUnsafeSuccess())
      .toEqual({ a: 'a', b: 1.1, c: ['a', 1.1, {}, null] })
  })
})