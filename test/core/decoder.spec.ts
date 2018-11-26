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

import { Decoder, fail, lazy, oneOf, sequence, succeed } from '../../src/core/decoder'
import { DecodeFailure, DecodeSuccess, success, failure } from '../../src/core/result'
import { decodeText, digit, letter, match, regexp, TextInput, testChar, char } from '../../src/text'
import { decodeValue, stringValue } from '../../src/value'

const decodeSuccess = <In, Err>() => Decoder.of<In, In, Err>(input => success<In, In, Err>(input, input))
const decodeFailure = <In>() => Decoder.of<In, In, In>(input => failure<In, In, In>(input, input))

const runSuccess = <In, Out, Err>(p: Decoder<In, Out, Err>, input: In) => {
  const r = p.run(input)
  if (r.isFailure()) fail(`decoder ${p} was supposed to succeed decoding '${input}'`)
  return [r.input, (r as DecodeSuccess<In, Out, Err>).value]
}

const runFailure = <In, Out, Err>(p: Decoder<In, Out, Err>, input: In) => {
  const r = p.run(input)
  if (r.isSuccess()) fail(`decoder ${p} was supposed to fail decoding '${input}'`)
  return [r.input, (r as DecodeFailure<In, Out, Err>).failures]
}

describe('decoder', () => {
  it('Decoder constructor and run', () => {
    const [input, value] = runSuccess(decodeSuccess(), 'a')
    expect(value).toEqual('a')
    expect(input).toEqual('a')

    const [source2, failure] = runFailure(decodeFailure(), 'b')
    expect(failure).toEqual(['b'])
    expect(source2).toEqual('b')
  })

  it('Decoder.flatMap transform the decoded value', () => {
    const result = decodeSuccess()
      .flatMap(x => Decoder.of(v => success('1', `${x}${v}`)))
      .run(2) as DecodeSuccess<string, string, number>
    expect(result.value).toEqual('22')
    const f = decodeSuccess()
      .flatMap(x => Decoder.of(v => failure('1', 'x')))
      .run(1) as DecodeFailure<string, string, number>
    expect(f.failures).toEqual(['x'])
  })

  it('Decoder.map transform the decoded value', () => {
    const result = decodeSuccess()
      .map(String)
      .run(1) as DecodeSuccess<string, string, number>
    expect(result.value).toEqual('1')
    const f = decodeFailure()
      .map(String)
      .run(1) as DecodeFailure<number, string, number>
    expect(f.failures).toEqual([1])
  })

  it('mapWithInput', () => {
    expect(decodeText(char.mapWithInput((r, i) => [r, i]))('a').getUnsafeSuccess()).toEqual([
      'a',
      { index: 0, input: 'a' }
    ])
    expect(decodeText(char.join(char.mapWithInput((r, i) => i)).map(t => t[1]))('ab').getUnsafeSuccess()).toEqual({
      index: 1,
      input: 'ab'
    })
    expect(decodeText(letter.mapWithInput((r, i) => [r, i]))('1').getUnsafeFailures()).toBeDefined()
  })

  it('Decoder.flatMapError transform the failure value', () => {
    const result = decodeSuccess()
      .flatMapError(e => Decoder.of(v => success('1', String(v))))
      .run(1) as DecodeSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = decodeFailure()
      .flatMapError(e => Decoder.of(v => failure('1', ...e)))
      .run(1) as DecodeFailure<string, number, string>
    expect(f.failures).toEqual([1])
    const s = decodeFailure()
      .flatMapError(e => Decoder.of(v => success('1', e)))
      .run(1) as DecodeSuccess<string, number, string>
    expect(s.value).toEqual([1])
  })

  it('Decoder.mapError transform the failure value', () => {
    const result = decodeSuccess()
      .mapError(String)
      .run(1) as DecodeSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = decodeFailure()
      .mapError(String)
      .run(1) as DecodeFailure<number, string, string>
    expect(f.failures).toEqual(['1'])
  })

  it('Decoder.result returns the passed value', () => {
    const result = decodeSuccess()
      .withResult(2)
      .run(1) as DecodeSuccess<string, number, string>
    expect(result.value).toEqual(2)
  })

  it('Decoder.join', () => {
    const decoder = regexp(/^1/)
      .join(regexp(/^a/))
      .join(regexp(/^b/))
    const result = decodeText(decoder)('1ab').getUnsafeSuccess()
    expect(result).toEqual([['1', 'a'], 'b'])
    const result2 = decodeText(decoder)('1ba').getUnsafeFailures()
    expect(result2).toBeDefined()
  })

  it('sequence', () => {
    const decoder = sequence(regexp(/^1/).map(Number), regexp(/^a/), regexp(/^b/))
    const result = decodeText(decoder)('1ab').getUnsafeSuccess()
    expect(result).toEqual([1, 'a', 'b'])
    const result2 = decodeText(decoder)('1ba').getUnsafeFailures()
    expect(result2).toBeDefined()
  })

  it('succeed', () => {
    expect(
      succeed('s')
        .run('any')
        .getUnsafeSuccess()
    ).toEqual('s')
  })

  it('fail', () => {
    expect(
      fail('s')
        .run('any')
        .getUnsafeFailures()
    ).toEqual(['s'])
  })

  it('lazy', () => {
    const p = lazy(() => succeed('s'))
    expect(p.run('any').getUnsafeSuccess()).toEqual('s')
    expect(p.run('any').getUnsafeSuccess()).toEqual('s')
  })

  it('repeatX', () => {
    const r2 = digit.repeat(2)
    expect(decodeText(r2)('1abc').getUnsafeFailures()).toBeDefined()
    expect(decodeText(r2)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(r2)('123b').getUnsafeSuccess()).toEqual(['1', '2'])

    const al1 = digit.atLeast(1)
    expect(decodeText(al1)('abc').getUnsafeFailures()).toBeDefined()
    expect(decodeText(al1)('1b').getUnsafeSuccess()).toEqual(['1'])
    expect(decodeText(al1)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(al1)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])

    const al2 = digit.atLeast(2)
    expect(decodeText(al2)('abc').getUnsafeFailures()).toBeDefined()
    expect(decodeText(al2)('1b').getUnsafeFailures()).toBeDefined()
    expect(decodeText(al2)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(al2)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])

    const am0 = digit.atMost(0)
    expect(decodeText(am0)('abc').getUnsafeSuccess()).toEqual([])
    expect(decodeText(am0)('1b').getUnsafeSuccess()).toEqual([])

    const am1 = digit.atMost(1)
    expect(decodeText(am1)('abc').getUnsafeSuccess()).toEqual([])
    expect(decodeText(am1)('1b').getUnsafeSuccess()).toEqual(['1'])
    expect(decodeText(am1)('12b').getUnsafeSuccess()).toEqual(['1'])

    const am2 = digit.atMost(2)
    expect(decodeText(am2)('abc').getUnsafeSuccess()).toEqual([])
    expect(decodeText(am2)('1b').getUnsafeSuccess()).toEqual(['1'])
    expect(decodeText(am2)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(am2)('123b').getUnsafeSuccess()).toEqual(['1', '2'])

    const b23 = digit.between(2, 3)
    expect(decodeText(b23)('1abc').getUnsafeFailures()).toBeDefined()
    expect(decodeText(b23)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(b23)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    expect(decodeText(b23)('1234abc').getUnsafeSuccess()).toEqual(['1', '2', '3'])

    const m2 = digit.many()
    expect(decodeText(m2)('abc').getUnsafeSuccess()).toEqual([])
    expect(decodeText(m2)('1b').getUnsafeSuccess()).toEqual(['1'])
    expect(decodeText(m2)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(m2)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
  })

  it('or', () => {
    const p = digit.or(match('a'))
    expect(decodeText(p)('1').getUnsafeSuccess()).toEqual('1')
    expect(decodeText(p)('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeText(p)('x').getUnsafeFailures()).toBeDefined()
  })

  it('oneOf', () => {
    const p = oneOf(digit.map(Number), match('a'))
    expect(decodeText(p)('1').getUnsafeSuccess()).toEqual(1)
    expect(decodeText(p)('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeText(p)('x').getUnsafeFailures()).toBeDefined()
    expect(() => oneOf().run('x' as never)).toThrow(Error)
  })

  it('sequence', () => {
    const decoder = sequence(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = decodeText(decoder)('1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
  })

  it('probe', () => {
    let value = undefined
    const p = digit.probe(v => (value = v))
    const result = p.run({ input: '1', index: 0 })
    expect(result).toBe(value)
  })

  it('atLeastXWithSeparator', () => {
    const m = letter.manyWithSeparator(match(','))
    expect(decodeText(m)('1').getUnsafeSuccess()).toEqual([])
    expect(decodeText(m)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(m)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(m)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const r1 = letter.repeatWithSeparator(1, match(','))
    expect(decodeText(r1)('1').getUnsafeFailures()).toBeDefined()
    expect(decodeText(r1)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(r1)('a,b').getUnsafeSuccess()).toEqual(['a'])

    const r2 = letter.repeatWithSeparator(2, match(','))
    expect(decodeText(r2)('1').getUnsafeFailures()).toBeDefined()
    expect(decodeText(r2)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeText(r2)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(r2)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b'])

    const p3 = letter.repeatWithSeparator(3, match(','))
    expect(decodeText(p3)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeText(p3)('a,b').getUnsafeFailures()).toBeDefined()
    expect(decodeText(p3)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeText(p3)('a,b,c,d,e').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const al1 = letter.atLeastWithSeparator(1, match(','))
    expect(decodeText(al1)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(al1)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(al1)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const al2 = letter.atLeastWithSeparator(2, match(','))
    expect(decodeText(al2)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeText(al2)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(al2)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const al3 = letter.atLeastWithSeparator(3, match(','))
    expect(decodeText(al3)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeText(al3)('a,b').getUnsafeFailures()).toBeDefined()
    expect(decodeText(al3)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const am0 = letter.atMostWithSeparator(0, match(','))
    expect(decodeText(am0)('a').getUnsafeSuccess()).toEqual([])
    expect(decodeText(am0)('a,b').getUnsafeSuccess()).toEqual([])

    const am1 = letter.atMostWithSeparator(1, match(','))
    expect(decodeText(am1)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(am1)('a,b').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(am1)('a,b,c').getUnsafeSuccess()).toEqual(['a'])

    const am2 = letter.atMostWithSeparator(2, match(','))
    expect(decodeText(am2)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(am2)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(am2)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b'])

    const am3 = letter.atMostWithSeparator(3, match(','))
    expect(decodeText(am3)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(am3)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(am3)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeText(am3)('a,b,c,d').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const b23 = letter.betweenWithSeparator(2, 3, match(','))
    expect(decodeText(b23)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeText(b23)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(b23)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeText(b23)('a,b,c,d').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const b32 = letter.betweenWithSeparator(3, 2, match(','))
    expect(decodeText(b32)('a').getUnsafeFailures()).toBeDefined()
    expect(decodeText(b32)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(b32)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeText(b32)('a,b,c,d').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])

    const b00 = letter.betweenWithSeparator(0, 0, match(','))
    expect(decodeText(b00)('a').getUnsafeSuccess()).toEqual([])
    expect(decodeText(b00)('a,b').getUnsafeSuccess()).toEqual([])
    expect(decodeText(b00)('a,b,c').getUnsafeSuccess()).toEqual([])
  })

  it('sub', () => {
    const p = stringValue.sub(regexp(/abc/y), input => ({ input, index: 0 }), v => v)
    const success = decodeValue(p)('abc').getUnsafeSuccess()
    expect(success).toBe('abc')

    const failure = decodeValue(p)('123abc').getUnsafeFailures()
    expect(failure).toBeDefined()
  })

  it('surroundedBy', () => {
    const p1 = testChar(v => v !== '>')
      .many()
      .map(v => v.join(''))
      .surroundedBy(match('<'), match('>'))
    expect(decodeText(p1)('<some>').getUnsafeSuccess()).toEqual('some')
    const p2 = match('\\"')
      .withResult('"')
      .or(testChar(v => v !== '"'))
      .many()
      .map(v => v.join(''))
      .surroundedBy(match('"'))
    expect(decodeText(p2)('"so\\"me"').getUnsafeSuccess()).toEqual('so"me')
  })
})
