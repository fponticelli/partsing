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

import { Decoder, Decoding } from '../core/decoder'
import { DecodeFailure, DecodeResult } from '../core/result'
import { MarkOptionalFields } from '../core/type_level'
import { DecodeError } from '../error'

export interface ValueInput {
  readonly input: any
  readonly path: (string | number)[]
}

export type ValueDecoder<T> = Decoder<ValueInput, T, DecodeError>

const make = <T>(f: Decoding<ValueInput, T, DecodeError>): ValueDecoder<T> =>
  Decoder.of<ValueInput, T, DecodeError>(f)

export const decodeValue = <T>(decoder: ValueDecoder<T>) => (input: any): DecodeResult<any, T, string> =>
  decoder.run({ input, path: []})
    .match({
      success: (s) => DecodeResult.success(input, s.value),
      failure: (f) => DecodeResult.failure(input, failureToString(f))
    })

export const testValue = <T>(f: (input: T) => boolean, expected: string) => make<T>(input =>
  f(input.input) ?
    DecodeResult.success(input, input.input) :
    DecodeResult.failure(input, DecodeError.expectedMatch(expected))
)

export const testType = <T>(expected: string) => make<T>(input =>
  typeof input.input === expected ?
    DecodeResult.success(input, input.input) :
    DecodeResult.failure(input, DecodeError.expectedMatch(expected))
)

export const nullableValue = <T>(decoder: ValueDecoder<T>) => decoder.or(DecodeError.combine, nullValue)
export const undefineableValue = <T>(decoder: ValueDecoder<T>) => decoder.or(DecodeError.combine, undefinedValue)
export const optionalValue = <T>(decoder: ValueDecoder<T>) => decoder.or(DecodeError.combine, undefinedValue, nullValue)

export const anyValue = make<any>(input => DecodeResult.success(input, input.input))
export const stringValue = testType<string>('string')
export const numberValue = testType<number>('number')
export const integerValue = numberValue.test(Number.isInteger, DecodeError.expectedMatch('integer'))
export const safeIntegerValue = numberValue.test(Number.isSafeInteger, DecodeError.expectedMatch('safe integer'))
export const finiteNumberValue = numberValue.test(Number.isFinite, DecodeError.expectedMatch('finite number'))
export const booleanValue = testType<boolean>('boolean')
export const undefinedValue = testType<undefined>('undefined')
export const nullValue = testValue<null>(v => v === null, 'null').withResult(null)
export const literalValue = <T>(value: T, eq: (a: T, b: T) => boolean = (a, b) => a === b) =>
  testValue((v: T) => eq(v, value), String(value)).withResult(value)

export const anyArrayValue = testValue<any[]>(Array.isArray, 'array')
export const arrayValue = <T>(decoder: ValueDecoder<T>) =>
  anyArrayValue.flatMap((values: any[]) =>
    make<T[]>((input: ValueInput) => {
      const length = values.length
      const buff = new Array(length)
      for (let i = 0; i < length; i++) {
        let s = { input: values[i], path: input.path.concat([i]) }
        let r = decoder.run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return DecodeResult.failure(r.input, r.failure)
        }
      }
      return DecodeResult.success(input, buff)
    })
  )

export const tupleValue = <U extends any[]>(...decoders: { [k in keyof U]: ValueDecoder<U[k]>}) =>
  anyArrayValue.flatMap((values: any[]) =>
    make<U>((input: ValueInput) => {
      const length = values.length
      const buff = new Array(length) as U
      for (let i = 0; i < length; i++) {
        let s = { input: values[i], path: input.path.concat([i]) }
        let r = decoders[i].run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return DecodeResult.failure(r.input, r.failure)
        }
      }
      return DecodeResult.success(input, buff)
    })
  )

const testObject = testType<{}>('object')

export const objectValue = <T, K extends keyof T>(
    fieldDecoders: { [k in keyof T]: ValueDecoder<T[k]> },
    optionalFields: K[]
  ): ValueDecoder<MarkOptionalFields<T, typeof optionalFields, K>> => {
    return testObject.flatMap((o: any) => {
      return make(input => {
        const mandatoryFields = Object.keys(fieldDecoders).filter(f => optionalFields.indexOf(f as K) < 0)
        const buff = {} as any
        for (let field of mandatoryFields) {
          if (o.hasOwnProperty(field)) {
            const s = { input: o[field], path: input.path.concat([field]) }
            const result = fieldDecoders[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return DecodeResult.failure(result.input, result.failure)
            }
          } else {
            return DecodeResult.failure(input, DecodeError.expectedField(field))
          }
        }
        for (let field of optionalFields) {
          if (o.hasOwnProperty(field)) {
            const s = { input: o[field], path: input.path.concat([field as never]) }
            const result = fieldDecoders[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return DecodeResult.failure(result.input, result.failure)
            }
          }
        }
        return DecodeResult.success(input, buff as never)
      })
    })
  }

const isToken = /^[a-z$_]+$/i
export const pathToString = (path: (string | number)[]): string => {
  return path.reduce(
    (acc: string, curr: string | number) => {
      if (typeof curr === 'number') {
        return `${acc}[${curr}]`
      } else if (isToken.test(curr)) {
        return acc.length === 0 ? curr : `${acc}.${curr}`
      } else {
        const t = curr.replace('"', '\\"')
        return `${acc}["${t}"]`
      }
    },
    ''
  )
}

export const failureToString = <Out>(err: DecodeFailure<ValueInput, Out, DecodeError>): string => {
  const { failure, input } = err
  const msg = failure.toString() + ' but got ' + String(input.input)
  const path = pathToString(input.path)
  if (path === '')
    return msg
  else
    return `${msg} at ${path}`
}
