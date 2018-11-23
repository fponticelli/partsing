/*
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  anyValue,
  arrayValue,
  booleanValue,
  decodeValue,
  finiteNumberValue,
  integerValue,
  literalValue,
  nullableValue,
  nullValue,
  numberValue,
  objectValue,
  optionalValue,
  pathToString,
  safeIntegerValue,
  stringValue,
  tupleValue,
  undefineableValue,
  undefinedValue
} from '../../src/value'

describe('value_decoder', () => {
  it('stringValue', () => {
    expect(decodeValue(stringValue)('abc').getUnsafeSuccess()).toEqual('abc')
    expect(decodeValue(stringValue)(1).getUnsafeFailures()).toEqual(['string but got 1'])
  })

  it('numberValue', () => {
    expect(decodeValue(numberValue)('abc').getUnsafeFailures()).toEqual(['number but got abc'])
    expect(decodeValue(numberValue)(1).getUnsafeSuccess()).toEqual(1)
  })

  it('booleanValue', () => {
    expect(decodeValue(booleanValue)('abc').getUnsafeFailures()).toEqual(['boolean but got abc'])
    expect(decodeValue(booleanValue)(true).getUnsafeSuccess()).toEqual(true)
    expect(decodeValue(booleanValue)(false).getUnsafeSuccess()).toEqual(false)
  })

  it('nullValue', () => {
    expect(decodeValue(nullValue)('abc').getUnsafeFailures()).toEqual(['null but got abc'])
    expect(decodeValue(nullValue)(null).getUnsafeSuccess()).toEqual(null)
  })

  it('undefinedValue', () => {
    expect(decodeValue(undefinedValue)('abc').getUnsafeFailures()).toEqual(['undefined but got abc'])
    expect(decodeValue(undefinedValue)(undefined).getUnsafeSuccess()).toEqual(undefined)
  })

  it('literalValue', () => {
    expect(decodeValue(literalValue('abc'))('abc').getUnsafeSuccess()).toEqual('abc')
    expect(decodeValue(literalValue({ id: 1 }, (a, b) => a.id === b.id))({ id: 1 }).getUnsafeSuccess()).toEqual({
      id: 1
    })
    expect(decodeValue(literalValue('abc'))(undefined).getUnsafeFailures()).toEqual(['abc but got undefined'])
    expect(decodeValue(literalValue('abc'))('ab').getUnsafeFailures()).toEqual(['abc but got ab'])
  })

  it('arrayValue', () => {
    const p = arrayValue(stringValue)
    expect(decodeValue(p)([]).getUnsafeSuccess()).toEqual([])
    expect(decodeValue(p)(['a', 'b', 'c']).getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeValue(p)(undefined).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)([1]).getUnsafeFailures()).toBeDefined()
  })

  it('tupleValue', () => {
    const p = tupleValue(stringValue, numberValue)
    expect(decodeValue(p)([]).getUnsafeSuccess()).toEqual([])
    expect(decodeValue(p)(['a', 1]).getUnsafeSuccess()).toEqual(['a', 1])
    expect(decodeValue(p)(undefined).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)(['a', 'b']).getUnsafeFailures()).toBeDefined()
  })

  it('or', () => {
    const p = stringValue.or(numberValue)
    expect(decodeValue(p)(1).getUnsafeSuccess()).toEqual(1)
    expect(decodeValue(p)([1]).getUnsafeFailures()).toBeDefined()
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
    expect(decodeValue(p)(undefined).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 1, c: undefined }).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 1, c: 2 }).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 'b' }).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)({ a: 'a' }).getUnsafeFailures()).toBeDefined()
    expect(decodeValue(p)({ a: 'a', b: 1, d: false }).getUnsafeSuccess()).toEqual({ a: 'a', b: 1 })
  })

  it('integerValue', () => {
    expect(decodeValue(integerValue)('abc').getUnsafeFailures()).toBeDefined()
    expect(decodeValue(integerValue)(1.1).getUnsafeFailures()).toEqual(['integer but got 1.1'])
    expect(decodeValue(integerValue)(1).getUnsafeSuccess()).toEqual(1)
  })

  it('safeIntegerValue', () => {
    expect(decodeValue(safeIntegerValue)('abc').getUnsafeFailures()).toBeDefined()
    expect(decodeValue(safeIntegerValue)(1.1).getUnsafeFailures()).toEqual(['safe integer but got 1.1'])
    expect(decodeValue(safeIntegerValue)(12345678901234567890).getUnsafeFailures()).toEqual([
      'safe integer but got 12345678901234567000'
    ])
    expect(decodeValue(safeIntegerValue)(1).getUnsafeSuccess()).toEqual(1)
  })

  it('finiteNumber', () => {
    expect(decodeValue(finiteNumberValue)(1 / 0).getUnsafeFailures()).toEqual(['finite number but got Infinity'])
    expect(decodeValue(finiteNumberValue)(1.1).getUnsafeSuccess()).toEqual(1.1)
  })

  it('nullables', () => {
    expect(decodeValue(nullableValue(stringValue))('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeValue(nullableValue(stringValue))(null).getUnsafeSuccess()).toBeNull()
    expect(decodeValue(nullableValue(stringValue))(undefined).getUnsafeFailures()).toBeDefined()

    expect(decodeValue(undefineableValue(stringValue))('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeValue(undefineableValue(stringValue))(undefined).getUnsafeSuccess()).toBeUndefined()
    expect(decodeValue(undefineableValue(stringValue))(null).getUnsafeFailures()).toBeDefined()

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
