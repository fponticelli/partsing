import {
    anyValue, arrayValue, booleanValue, decodeValue, finiteNumberValue, integerValue, literalValue,
    nullableValue, nullValue, numberValue, objectValue, optionalValue, pathToString,
    safeIntegerValue, stringValue, tupleValue, undefineableValue, undefinedValue
} from '../../src/value'

describe('value_decoder', () => {
  it('stringValue', () => {
    expect(decodeValue(stringValue)('abc').getUnsafeSuccess()).toEqual('abc')
    expect(decodeValue(stringValue)(1).getUnsafeFailure()).toEqual('expected string but got 1')
  })

  it('numberValue', () => {
    expect(decodeValue(numberValue)('abc').getUnsafeFailure()).toEqual('expected number but got abc')
    expect(decodeValue(numberValue)(1).getUnsafeSuccess()).toEqual(1)
  })

  it('booleanValue', () => {
    expect(decodeValue(booleanValue)('abc').getUnsafeFailure()).toEqual('expected boolean but got abc')
    expect(decodeValue(booleanValue)(true).getUnsafeSuccess()).toEqual(true)
    expect(decodeValue(booleanValue)(false).getUnsafeSuccess()).toEqual(false)
  })

  it('nullValue', () => {
    expect(decodeValue(nullValue)('abc').getUnsafeFailure()).toEqual('expected null but got abc')
    expect(decodeValue(nullValue)(null).getUnsafeSuccess()).toEqual(null)
  })

  it('undefinedValue', () => {
    expect(decodeValue(undefinedValue)('abc').getUnsafeFailure()).toEqual('expected undefined but got abc')
    expect(decodeValue(undefinedValue)(undefined).getUnsafeSuccess()).toEqual(undefined)
  })

  it('literalValue', () => {
    expect(decodeValue(literalValue('abc'))('abc').getUnsafeSuccess()).toEqual('abc')
    expect(decodeValue(literalValue({ id: 1 }, (a, b) => a.id === b.id))({ id: 1 }).getUnsafeSuccess()).toEqual({ id: 1 })
    expect(decodeValue(literalValue('abc'))(undefined).getUnsafeFailure()).toEqual('expected abc but got undefined')
    expect(decodeValue(literalValue('abc'))('ab').getUnsafeFailure()).toEqual('expected abc but got ab')
  })

  it('arrayValue', () => {
    const p = arrayValue(stringValue)
    expect(decodeValue(p)([]).getUnsafeSuccess()).toEqual([])
    expect(decodeValue(p)(['a', 'b', 'c']).getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeValue(p)(undefined).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)('a').getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)([1]).getUnsafeFailure()).toBeDefined()
  })

  it('tupleValue', () => {
    const p = tupleValue(stringValue, numberValue)
    expect(decodeValue(p)([]).getUnsafeSuccess()).toEqual([])
    expect(decodeValue(p)(['a', 1]).getUnsafeSuccess()).toEqual(['a', 1])
    expect(decodeValue(p)(undefined).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)(['a', 'b']).getUnsafeFailure()).toBeDefined()
  })

  it('objectValue', () => {
    const p = objectValue(
      {
        a: stringValue,
        b: numberValue,
        c: booleanValue
      },
      ['c']
    )
    expect(decodeValue(p)({ a: 'a', b: 1 }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1 })
    expect(decodeValue(p)({ a: 'a', b: 1, c: false }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1, c: false })
    expect(decodeValue(p)(undefined).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 1, c: undefined }).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 1, c: 2 }).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 'b' }).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)({ a: 'a' }).getUnsafeFailure()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 1, d: false }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1 })
  })

  it('integerValue', () => {
    expect(decodeValue(integerValue)('abc').getUnsafeFailure()).toBeDefined()
    expect(decodeValue(integerValue)(1.1).getUnsafeFailure()).toEqual('expected integer but got 1.1')
    expect(decodeValue(integerValue)(1).getUnsafeSuccess()).toEqual(1)
  })

  it('safeIntegerValue', () => {
    expect(decodeValue(safeIntegerValue)('abc').getUnsafeFailure()).toBeDefined()
    expect(decodeValue(safeIntegerValue)(1.1).getUnsafeFailure()).toEqual('expected safe integer but got 1.1')
    expect(decodeValue(safeIntegerValue)(12345678901234567890).getUnsafeFailure())
      .toEqual('expected safe integer but got 12345678901234567000')
    expect(decodeValue(safeIntegerValue)(1).getUnsafeSuccess()).toEqual(1)
  })

  it('finiteNumber', () => {
    expect(decodeValue(finiteNumberValue)(1 / 0).getUnsafeFailure()).toEqual('expected finite number but got Infinity')
    expect(decodeValue(finiteNumberValue)(1.1).getUnsafeSuccess()).toEqual(1.1)
  })

  it('nullables', () => {
    expect(decodeValue(nullableValue(stringValue))('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeValue(nullableValue(stringValue))(null).getUnsafeSuccess()).toBeNull()
    expect(decodeValue(nullableValue(stringValue))(undefined).getUnsafeFailure()).toBeDefined()
    
    expect(decodeValue(undefineableValue(stringValue))('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeValue(undefineableValue(stringValue))(undefined).getUnsafeSuccess()).toBeUndefined()
    expect(decodeValue(undefineableValue(stringValue))(null).getUnsafeFailure()).toBeDefined()
    
    expect(decodeValue(optionalValue(stringValue))('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeValue(optionalValue(stringValue))(null).getUnsafeSuccess()).toBeNull()
    expect(decodeValue(optionalValue(stringValue))(undefined).getUnsafeSuccess()).toBeUndefined()

    expect(decodeValue(anyValue)(1).getUnsafeSuccess()).toEqual(1)
    expect(decodeValue(anyValue)('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeValue(anyValue)(true).getUnsafeSuccess()).toEqual(true)
    expect(decodeValue(anyValue)(null).getUnsafeSuccess()).toBeNull()
    expect(decodeValue(anyValue)(undefined).getUnsafeSuccess()).toBeUndefined()
  })

  it('pathToString', () => {
    expect(pathToString(['a', 'a b c', 'd', 1, '$f'])).toEqual('a["a b c"].d[1].$f')
  })
})
