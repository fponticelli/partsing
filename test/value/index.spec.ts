import {
  arrayValue,
  booleanValue,
  nullValue,
  numberValue,
  objectValue,
  undefinedValue,
  literalValue,
  parseValue,
  stringValue,
  tupleValue,
  integerValue,
  safeIntegerValue,
  finiteNumberValue,
  nullableValue,
  undefineableValue,
  optionalValue,
  anyValue
} from '../../src/value'

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

  it('arrayValue', () => {
    const p = arrayValue(stringValue)
    expect(parseValue(p, []).getUnsafeSuccess()).toEqual([])
    expect(parseValue(p, ['a', 'b', 'c']).getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(parseValue(p, undefined).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, 'a').getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, [1]).getUnsafeFailure()).toBeDefined()
  })

  it('tupleValue', () => {
    const p = tupleValue(stringValue, numberValue)
    expect(parseValue(p, []).getUnsafeSuccess()).toEqual([])
    expect(parseValue(p, ['a', 1]).getUnsafeSuccess()).toEqual(['a', 1])
    expect(parseValue(p, undefined).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, ['a', 'b']).getUnsafeFailure()).toBeDefined()
  })

  it('objectValue', () => {
    const p = objectValue(
      {
        a: stringValue,
        b: numberValue,
        c: booleanValue
      },
      'c'
    )
    expect(parseValue(p, { a: 'a', b: 1 }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1 })
    expect(parseValue(p, { a: 'a', b: 1, c: false }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1, c: false })
    expect(parseValue(p, undefined).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, { a: 'a', b: 1, c: undefined }).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, { a: 'a', b: 1, c: 2 }).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, { a: 'a', b: 'b' }).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, { a: 'a' }).getUnsafeFailure()).toBeDefined()
    expect(parseValue(p, { a: 'a', b: 1, d: false }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1 })
  })

  it('integerValue', () => {
    expect(parseValue(integerValue, 'abc').getUnsafeFailure()).toBeDefined()
    expect(parseValue(integerValue, 1.1).getUnsafeFailure()).toEqual('expected integer')
    expect(parseValue(integerValue, 1).getUnsafeSuccess()).toEqual(1)
  })

  it('safeIntegerValue', () => {
    expect(parseValue(safeIntegerValue, 'abc').getUnsafeFailure()).toBeDefined()
    expect(parseValue(safeIntegerValue, 1.1).getUnsafeFailure()).toEqual('expected safe integer')
    expect(parseValue(safeIntegerValue, 12345678901234567890).getUnsafeFailure()).toEqual('expected safe integer')
    expect(parseValue(safeIntegerValue, 1).getUnsafeSuccess()).toEqual(1)
  })

  it('finiteNumber', () => {
    expect(parseValue(finiteNumberValue, 1 / 0).getUnsafeFailure()).toEqual('expected finite number')
    expect(parseValue(finiteNumberValue, 1.1).getUnsafeSuccess()).toEqual(1.1)
  })

  it('nullables', () => {
    expect(parseValue(nullableValue(stringValue), 'a').getUnsafeSuccess()).toEqual('a')
    expect(parseValue(nullableValue(stringValue), null).getUnsafeSuccess()).toBeNull()
    expect(parseValue(nullableValue(stringValue), undefined).getUnsafeFailure()).toBeDefined()
    
    expect(parseValue(undefineableValue(stringValue), 'a').getUnsafeSuccess()).toEqual('a')
    expect(parseValue(undefineableValue(stringValue), undefined).getUnsafeSuccess()).toBeUndefined()
    expect(parseValue(undefineableValue(stringValue), null).getUnsafeFailure()).toBeDefined()
    
    expect(parseValue(optionalValue(stringValue), 'a').getUnsafeSuccess()).toEqual('a')
    expect(parseValue(optionalValue(stringValue), null).getUnsafeSuccess()).toBeNull()
    expect(parseValue(optionalValue(stringValue), undefined).getUnsafeSuccess()).toBeUndefined()

    expect(parseValue(anyValue, 1).getUnsafeSuccess()).toEqual(1)
    expect(parseValue(anyValue, 'a').getUnsafeSuccess()).toEqual('a')
    expect(parseValue(anyValue, true).getUnsafeSuccess()).toEqual(true)
    expect(parseValue(anyValue, null).getUnsafeSuccess()).toBeNull()
    expect(parseValue(anyValue, undefined).getUnsafeSuccess()).toBeUndefined()
  })
})
