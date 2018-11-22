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
import { DecodeError } from '../../src/error'
import { decodeText, digit, letter, match, regexp } from '../../src/text'
import { TextInput } from '../../src/text/input'
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
  return [r.input, (r as DecodeFailure<In, Out, Err>).failure]
}

describe('decoder', () => {
  it('Decoder constructor and run', () => {
    const [input, value] = runSuccess(decodeSuccess(), 'a')
    expect(value).toEqual('a')
    expect(input).toEqual('a')

    const [source2, failure] = runFailure(decodeFailure(), 'b')
    expect(failure).toEqual('b')
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
    expect(f.failure).toEqual('x')
  })

  it('Decoder.map transform the decoded value', () => {
    const result = decodeSuccess()
      .map(String)
      .run(1) as DecodeSuccess<string, string, number>
    expect(result.value).toEqual('1')
    const f = decodeFailure()
      .map(String)
      .run(1) as DecodeFailure<number, string, number>
    expect(f.failure).toEqual(1)
  })

  it('Decoder.flatMapError transform the failure value', () => {
    const result = decodeSuccess()
      .flatMapError(e => Decoder.of(v => success('1', String(v))))
      .run(1) as DecodeSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = decodeFailure()
      .flatMapError(e => Decoder.of(v => failure('1', e)))
      .run(1) as DecodeFailure<string, number, string>
    expect(f.failure).toEqual(1)
    const s = decodeFailure()
      .flatMapError(e => Decoder.of(v => success('1', e)))
      .run(1) as DecodeSuccess<string, number, string>
    expect(s.value).toEqual(1)
  })

  it('Decoder.mapError transform the failure value', () => {
    const result = decodeSuccess()
      .mapError(String)
      .run(1) as DecodeSuccess<number, string, string>
    expect(result.value).toEqual(1)
    const f = decodeFailure()
      .mapError(String)
      .run(1) as DecodeFailure<number, string, string>
    expect(f.failure).toEqual('1')
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
    const result2 = decodeText(decoder)('1ba').getUnsafeFailure()
    expect(result2).toBeDefined()
  })

  it('sequence', () => {
    const decoder = sequence<TextInput, [string, string, string], DecodeError>(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = decodeText(decoder)('1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
    const result2 = decodeText(decoder)('1ba').getUnsafeFailure()
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
        .getUnsafeFailure()
    ).toEqual('s')
  })

  it('lazy', () => {
    const p = lazy(() => succeed('s'))
    expect(p.run('any').getUnsafeSuccess()).toEqual('s')
    expect(p.run('any').getUnsafeSuccess()).toEqual('s')
  })

  it('repeatX', () => {
    const p = digit.repeatBetween(2, 3)
    expect(decodeText(p)('1abc').getUnsafeFailure()).toBeDefined()
    expect(decodeText(p)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(p)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    expect(decodeText(p)('1234abc').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const t = digit.repeat(2)
    expect(decodeText(t)('1abc').getUnsafeFailure()).toBeDefined()
    expect(decodeText(t)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(t)('123b').getUnsafeSuccess()).toEqual(['1', '2'])
    const a = digit.repeatAtMost(2)
    expect(decodeText(a)('abc').getUnsafeSuccess()).toEqual([])
    expect(decodeText(a)('1b').getUnsafeSuccess()).toEqual(['1'])
    expect(decodeText(a)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(a)('123b').getUnsafeSuccess()).toEqual(['1', '2'])
    const m = digit.repeatAtLeast()
    expect(decodeText(m)('abc').getUnsafeFailure()).toBeDefined()
    expect(decodeText(m)('1b').getUnsafeSuccess()).toEqual(['1'])
    expect(decodeText(m)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(m)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
    const m2 = digit.repeatAtLeast(2)
    expect(decodeText(m2)('abc').getUnsafeFailure()).toBeDefined()
    expect(decodeText(m2)('1b').getUnsafeFailure()).toBeDefined()
    expect(decodeText(m2)('12b').getUnsafeSuccess()).toEqual(['1', '2'])
    expect(decodeText(m2)('123b').getUnsafeSuccess()).toEqual(['1', '2', '3'])
  })

  it('or', () => {
    const p = digit.or(DecodeError.combine, match('a'))
    expect(decodeText(p)('1').getUnsafeSuccess()).toEqual('1')
    expect(decodeText(p)('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeText(p)('x').getUnsafeFailure()).toBeDefined()

    const p1 = digit.or(undefined, match('a'))
    expect(decodeText(p1)('x').getUnsafeFailure()).toBeDefined()
  })

  it('oneOf', () => {
    const p = oneOf<TextInput, [string, string], DecodeError>(DecodeError.combine, digit, match('a'))
    expect(decodeText(p)('1').getUnsafeSuccess()).toEqual('1')
    expect(decodeText(p)('a').getUnsafeSuccess()).toEqual('a')
    expect(decodeText(p)('x').getUnsafeFailure()).toBeDefined()
    expect(() => decodeText(oneOf(DecodeError.combine))('x')).toThrow(Error)

    const p2 = oneOf<TextInput, [string, string], DecodeError>(undefined, digit, match('a'))
    expect(decodeText(p2)('x').getUnsafeFailure()).toBeDefined()
  })

  it('sequence', () => {
    const decoder = sequence<TextInput, [string, string, string], DecodeError>(regexp(/^1/), regexp(/^a/), regexp(/^b/))
    const result = decodeText(decoder)('1ab').getUnsafeSuccess()
    expect(result).toEqual(['1', 'a', 'b'])
  })

  it('probe', () => {
    let value = undefined
    const p = digit.probe(v => (value = v))
    const result = p.run({ input: '1', index: 0 })
    expect(result).toBe(value)
  })

  it('separatedBy', () => {
    const p = letter.separatedBy(match(','))
    expect(decodeText(p)('1').getUnsafeSuccess()).toEqual([])
    expect(decodeText(p)('a').getUnsafeSuccess()).toEqual(['a'])
    expect(decodeText(p)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(p)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
  })

  it('separatedByTimes', () => {
    const p1 = letter.separatedByTimes(match(','), 1)
    expect(decodeText(p1)('a').getUnsafeSuccess()).toEqual(['a'])

    const p3 = letter.separatedByTimes(match(','), 3)
    expect(decodeText(p3)('a').getUnsafeFailure()).toBeDefined()
    expect(decodeText(p3)('a,b').getUnsafeFailure()).toBeDefined()
    expect(decodeText(p3)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
    expect(decodeText(p3)('a,b,c,d,e').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
  })

  it('separatedByAtLeastOnce', () => {
    const p = letter.separatedByAtLeastOnce(match(','))
    expect(decodeText(p)('a').getUnsafeFailure()).toBeDefined()
    expect(decodeText(p)('a,b').getUnsafeSuccess()).toEqual(['a', 'b'])
    expect(decodeText(p)('a,b,c').getUnsafeSuccess()).toEqual(['a', 'b', 'c'])
  })

  it('sub', () => {
    const p = stringValue.sub(regexp(/abc/y), input => ({ input, index: 0 }), v => v)
    const success = decodeValue(p)('abc').getUnsafeSuccess()
    expect(success).toBe('abc')

    const failure = decodeValue(p)('123abc').getUnsafeFailure()
    expect(failure).toBeDefined()
  })
})
