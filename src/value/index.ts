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

/**
 * This module contains a set of decoders and utility functions to decode
 * JavaScript values. A typical scenario would be decoding the result of an AJAX
 * call after it has been processed by `JSON.parse`.
 */

import { Decoder, Decoding } from '../core/decoder'
import { DecodeFailure, DecodeResult, success, failure } from '../core/result'
import { MarkOptionalFields } from '../core/type_level'
import { DecodeError, Entity } from '../error'
import { valueToString, pathToString } from '../utils'

/**
 * `ValueInput` stores the current `input` value as a `any` (any JS value) and
 * contains a `path` value to identify the position in the current context.
 *
 * `path` is an array of either `string` values (field names of an object) or
 * `number` values (index inside an array).
 */
export interface ValueInput {
  /**
   * The input JavaScript value. It can be any value of any type.
   *
   * When decoders traverse an array or object value, they will pass only the
   * currently inspected element to the next decoder and not the source value.
   */
  readonly input: any

  /**
   * The current path for this value input.
   */
  readonly path: (string | number)[]
}

/**
 * Type alias for a decoder specialized in consuming values of type `{@link ValueInput}`
 * and generate errors of type `{@link DecodeError}`.
 */
export type ValueDecoder<T> = Decoder<ValueInput, T, DecodeError>

/**
 * Utility function to generate a decoder of type `{@link ValueDecoder}` from a function `f`.
 */
const make = <T>(f: Decoding<ValueInput, T, DecodeError>): ValueDecoder<T> => Decoder.of<ValueInput, T, DecodeError>(f)

/**
 * Helper function that return a function to decode from an `input` of type `any` to a `DecodeResult`.
 *
 * The function takes a `ValueDecoder` as the only argument.
 *
 * This convenience function exists because `ValueDecoder` requires an input of
 * type {@link ValueInput} and not just `any`.
 */
export const decodeValue = <T>(decoder: ValueDecoder<T>) => (input: any): DecodeResult<any, T, string> =>
  decoder.run({ input, path: [] }).match({
    success: s => success(input, s.value),
    failure: f => failure(input, failureToString(f))
  })

/**
 * It expects an input of type `T` to pass the check made by the predicate
 * function `f`. Notice that testValue doesn't (cannot) check that the input
 * is really of type `T`. Such check must be performed by predicate itself.
 */
export const testValue = <T>(f: (input: T) => boolean, expected: string) =>
  make<T>(input =>
    f(input.input) ? success(input, input.input) : failure(input, DecodeError.expectedMatch(Entity.PREDICATE, expected))
  )

/**
 * Given a type in `string` format, it checks that the current `input` matches it
 * using `typeof`.
 */
export const testType = <T>(expected: string) =>
  make<T>(input =>
    typeof input.input === expected
      ? success(input, input.input)
      : failure(input, DecodeError.expectedMatch(Entity.TYPE, expected))
  )

/**
 * Transform a decoder into one that consumes either the value from the passed decoder
 * or `null`.
 */
export const nullableValue = <T>(decoder: ValueDecoder<T>) => decoder.or(nullValue)

/**
 * Transform a decoder into one that consumes either the value from the passed decoder
 * or `undefined`.
 */
export const undefineableValue = <T>(decoder: ValueDecoder<T>) => decoder.or(undefinedValue)

/**
 * Transform a decoder into one that consumes either the value from the passed decoder,
 * `null` or `undefined`.
 */
export const optionalValue = <T>(decoder: ValueDecoder<T>) => decoder.or(undefinedValue, nullValue)

/**
 * Decoder that always retun the input value as an untyped (`any`) value.
 */
export const anyValue = make<any>(input => success(input, input.input))

/**
 * Decoder that matches a string value.
 */
export const stringValue = testType<string>('string')

/**
 * Decoder that matches a numeric value.
 */
export const numberValue = testType<number>('number')

/**
 * Decoder that matches an integer value.
 */
export const integerValue = numberValue.test(Number.isInteger, DecodeError.expectedMatch(Entity.TYPE, 'integer'))

/**
 * Decoder that matches a safe-integer value.
 */
export const safeIntegerValue = numberValue.test(
  Number.isSafeInteger,
  DecodeError.expectedMatch(Entity.TYPE, 'safe integer')
)

/**
 * Decoder that matches a finite-number value.
 */
export const finiteNumberValue = numberValue.test(
  Number.isFinite,
  DecodeError.expectedMatch(Entity.TYPE, 'finite number')
)

/**
 * Decoder that matches a boolean value.
 */
export const booleanValue = testType<boolean>('boolean')

/**
 * Decoder that matches an `undefined` value.
 */
export const undefinedValue = testType<undefined>('undefined')

/**
 * Decoder that matches a `null` value.
 */
export const nullValue = testValue<null>(v => v === null, 'null')
  .withResult(null)
  .withFailure(DecodeError.expectedMatch(Entity.TYPE, 'null'))

/**
 * A decoder that doesn't consume any input but does return the current path
 * position as its result value.
 */
export const currentPath = make(input => success(input, input.path))

/**
 * Decoder that matches exactly a specified literal value of type `T`.
 *
 * By default this function uses strict equality. If that is not the desired
 * behavior, an equality function can be provided.
 */
export const literalValue = <T>(value: T, eq: (a: T, b: T) => boolean = (a, b) => a === b) =>
  testValue((v: T) => eq(v, value), String(value))
    .withResult(value)
    .withFailure(DecodeError.expectedMatch(Entity.LITERAL, `${value}`))

/**
 * Decoder that matches an array. Element values are not decoded and are typed
 * as `any`.
 */
export const anyArrayValue = testValue<any[]>(Array.isArray, 'array')

/**
 * Create a decoder that matches an array. Each element is decoded applying
 * the passed `decoder` argument.
 */
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
          return failure(r.input, ...r.failures)
        }
      }
      return success(input, buff)
    })
  )

/**
 * It creates a tuple decoder by passing any number of decoders.
 *
 * The number of expected elements in the tuple must match the number of provided
 * decoders.
 */
export const tupleValue = <U extends any[]>(...decoders: { [k in keyof U]: ValueDecoder<U[k]> }) =>
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
          return failure(r.input, ...r.failures)
        }
      }
      return success(input, buff)
    })
  )

/**
 * Decoder that validates a value to be an object.
 */
export const testObject = testType<{}>('object').flatMap(value => {
  return Decoder.of(input => {
    if (Array.isArray(value)) {
      return failure(input, DecodeError.expectedMatch(Entity.TYPE, 'not array'))
    } else {
      return success(input, value)
    }
  })
})

/**
 * Create a decoder to validate objects.
 *
 * Each field in the passed object argument `fieldDecoders` is a distinct decoder
 * for a matching field in the input object.
 *
 * The second argument `optionalFields`, marks the fields to consider optionals.
 */
export function objectValue<T extends {}, K extends keyof T = keyof T>(
  fieldDecoders: { [K in keyof T]: ValueDecoder<T[K]> },
  optionalFields: [...K[]]
): ValueDecoder<MarkOptionalFields<T, typeof optionalFields>> {
  type OF = typeof optionalFields
  return testObject.flatMap((o: any) => {
    return make(input => {
      const mandatoryFields = Object.keys(fieldDecoders).filter(f => optionalFields.indexOf(f as K) < 0) as OF
      const buff = {} as any
      for (let field of mandatoryFields) {
        if (o.hasOwnProperty(field)) {
          const s = { input: o[field], path: input.path.concat([field as string]) }
          const result = fieldDecoders[field].run(s)
          if (result.isSuccess()) {
            buff[field] = result.value
          } else {
            return failure(result.input, ...result.failures)
          }
        } else {
          return failure(input, DecodeError.expectedField(field as string))
        }
      }
      for (let field of optionalFields) {
        if (o.hasOwnProperty(field)) {
          const s = { input: o[field], path: input.path.concat([field as string]) }
          const result = fieldDecoders[field].run(s)
          if (result.isSuccess()) {
            buff[field] = result.value
          } else {
            return failure(result.input, ...result.failures)
          }
        }
      }
      return success(input, buff)
    })
  })
}

/**
 * Decodes an object applying a decoder for the keys and one for values of each
 * field pair.
 */
export const recordValue = <K extends string | number | symbol, T>(
  keyDecoder: ValueDecoder<K>,
  valueDecoder: ValueDecoder<T>
): ValueDecoder<Record<K, T>> => {
  return testObject.flatMap((o: any) => {
    return make(input => {
      const buff = {} as any
      for (let field of Object.keys(o)) {
        const keyResult = keyDecoder.run({ input: field, path: input.path })
        if (keyResult.isSuccess()) {
          const key = keyResult.value
          const value = o[field]
          const valueResult = valueDecoder.run({ input: value, path: input.path.concat([field]) })
          if (valueResult.isSuccess()) {
            buff[key] = valueResult.value
          } else {
            return failure(valueResult.input, ...valueResult.failures)
          }
        } else {
          return failure(keyResult.input, ...keyResult.failures)
        }
      }
      return success(input, buff)
    })
  })
}

/**
 * Same as {@link recodValue} enforcing string keys.
 */
export const stringRecordValue = <T>(valueDecoder: ValueDecoder<T>): ValueDecoder<Record<string, T>> =>
  recordValue(stringValue, valueDecoder)

/**
 * Pretty prints a `DecodeFailure<ValueInput, Out, DecodeError>`.
 */
export const failureToString = <Out>(err: DecodeFailure<ValueInput, Out, DecodeError>): string => {
  const { failures, input } = err
  const expected =
    failures.length === 1 ? failures[0].toString() : `one of:\n * ${failures.map(v => v.toString()).join('\n * ')}\n`
  const msg = `${expected} but got ${valueToString(input.input)}`
  const path = pathToString(input.path)
  if (path === '') return msg
  else return `expected ${msg} at ${path}`
}
