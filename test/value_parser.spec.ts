import {
  booleanValue,
  nullValue,
  numberValue,
  undefinedValue,
  literalValue,
  parseValue,
  stringValue
} from '../src/value_parser'

describe('value_parser', () => {
  it('stringValue', () => {
    expect(parseValue(stringValue, 'abc').getUnsafeSuccess()).toEqual('abc')
    expect(parseValue(stringValue, 1).getUnsafeFailure()).toEqual('expected string but got number')
  })

  it('numberValue', () => {
    expect(parseValue(numberValue, 'abc').getUnsafeFailure()).toEqual('expected number but got string')
    expect(parseValue(numberValue, 1).getUnsafeSuccess()).toEqual(1)
  })

  it('booleanValue', () => {
    expect(parseValue(booleanValue, 'abc').getUnsafeFailure()).toEqual('expected boolean but got string')
    expect(parseValue(booleanValue, true).getUnsafeSuccess()).toEqual(true)
    expect(parseValue(booleanValue, false).getUnsafeSuccess()).toEqual(false)
  })

  it('nullValue', () => {
    expect(parseValue(nullValue, 'abc').getUnsafeFailure()).toEqual('expected null but got abc')
    expect(parseValue(nullValue, null).getUnsafeSuccess()).toEqual(null)
  })

  it('undefinedValue', () => {
    expect(parseValue(undefinedValue, 'abc').getUnsafeFailure()).toEqual('expected undefined but got string')
    expect(parseValue(undefinedValue, undefined).getUnsafeSuccess()).toEqual(undefined)
  })

  it('literalValue', () => {
    expect(parseValue(literalValue('abc'), 'abc').getUnsafeSuccess()).toEqual('abc')
    expect(parseValue(literalValue({ id: 1 }, (a, b) => a.id === b.id), { id: 1 }).getUnsafeSuccess()).toEqual({ id: 1 })
    expect(parseValue(literalValue('abc'), undefined).getUnsafeFailure()).toEqual('expected abc but got undefined')
    expect(parseValue(literalValue('abc'), 'ab').getUnsafeFailure()).toEqual('expected abc but got ab')
  })
})
