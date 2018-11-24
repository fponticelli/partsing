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
 * string values.
 */

import { Decoder, Decoding } from '../core/decoder'
import { DecodeFailure, DecodeResult, DecodeSuccess, success, failure } from '../core/result'
import { DecodeError, Entity } from '../error'

/**
 * `TextInput` stores the entire `input` value as a `string` and contains
 * an `index` as the current character position inside the stream.
 */
export interface TextInput {
  /**
   * The string input. Its value is never modified by the decoders at any point
   * in the chain.
   */
  readonly input: string

  /**
   * The current position reached by a decoder.
   */
  readonly index: number
}

/**
 * Type alias for a decoder specialized in consuming values of type `{@link TextInput}`
 * and generate errors of type `{@link DecodeError}`.
 */
export type TextDecoder<T> = Decoder<TextInput, T, DecodeError>

/**
 * Utility function to generate a decoder of type `{@link ValueDecoder}` from a function `f`.
 */
const make = <T>(f: Decoding<TextInput, T, DecodeError>): TextDecoder<T> => Decoder.of<TextInput, T, DecodeError>(f)

/**
 * Helper function that return a function to decode from an `input` of type `string` to a `DecodeResult`.
 *
 * The function takes a `TextDecoder` as the only argument.
 *
 * This convenience function exists because `TextDecoder` requires an input of
 * type {@link TextInput} and not `string`.
 */
export const decodeText = <T>(decoder: TextDecoder<T>) => (input: string): DecodeResult<string, T, string> =>
  decoder.run({ input, index: 0 }).match({
    success: r => success(input, r.value),
    failure: f => failure(input, failureToString(f))
  })

/**
 * Generate a `TextDecoder` that uses a `RegExp` pattern to match a result.
 *
 * By default, this decoder will capture the first group (group 0) returned from
 * the regular expression. This can be changed by providing a different value to
 * `group`.
 *
 * If the JS runtime you are working with allows it, it is suggested to use the
 * **stycky** modifier `y`. Its main advantage is that it doesn't need to reallocate
 * a substring of the original input to perform its matching.
 */
export const regexp = (pattern: RegExp, group = 0): TextDecoder<string> => {
  if (pattern.sticky) {
    return make((input: TextInput) => {
      pattern.lastIndex = input.index
      const res = pattern.exec(input.input)
      if (res == null) {
        return new DecodeFailure(input, DecodeError.patternMismatch(pattern.source))
      } else {
        return new DecodeSuccess({ ...input, index: pattern.lastIndex }, res[group])
      }
    })
  } else if (pattern.global) {
    return make((input: TextInput) => {
      const s = input.input.substring(input.index)
      pattern.lastIndex = 0
      const res = pattern.exec(s)
      if (res == null) {
        return new DecodeFailure(input, DecodeError.patternMismatch(pattern.source))
      } else {
        const index = input.index + pattern.lastIndex
        return new DecodeSuccess({ ...input, index }, res[group])
      }
    })
  } else {
    return make((input: TextInput) => {
      const s = input.input.substring(input.index)
      pattern.lastIndex = 0
      const res = pattern.exec(s)
      if (res == null) {
        return new DecodeFailure(input, DecodeError.patternMismatch(pattern.source))
      } else {
        const index = input.index + s.indexOf(res[0]) + res[0].length
        return new DecodeSuccess({ ...input, index }, res[group])
      }
    })
  }
}

/**
 * A decoder that doesn't consume any portion of the string but does
 * return the current index position as its result value.
 */
export const withPosition = make(input => new DecodeSuccess(input, input.index))

/**
 * A decoder that produces all the remaining characters in `TextInput`.
 */
export const rest = make(input => {
  const value = input.input.substring(input.index)
  return new DecodeSuccess({ ...input, index: input.input.length }, value)
})

/**
 * A decoder that doesn't consume anything from the `TextInput` and produces
 * `undefined` if it matches the end of the input.
 */
export const eoi: Decoder<TextInput, void, DecodeError> = make(input => {
  const index = input.input.length
  if (input.index === index) {
    return new DecodeSuccess({ ...input, index }, undefined)
  } else {
    return new DecodeFailure(input, DecodeError.expectedEoi)
  }
})

/**
 * Create a decoder that consume and produces an exact string match.
 */
export const match = <V extends string>(s: V): TextDecoder<V> => {
  const length = s.length
  return make(input => {
    const index = input.index + length
    const value = input.input.substring(input.index, index)
    if (value === s) {
      return new DecodeSuccess({ ...input, index }, s)
    } else {
      return new DecodeFailure(input, DecodeError.expectedMatch(`"${s}"`))
    }
  })
}

/**
 * Same as {@link match} but case-insensitive.
 */
export const matchInsensitive = (s: string): TextDecoder<string> => {
  const t = s.toLowerCase()
  const length = s.length
  return make(input => {
    const index = input.index + length
    const value = input.input.substring(input.index, index)
    const valueInsensitive = value.toLowerCase()
    if (valueInsensitive === t) {
      return new DecodeSuccess({ ...input, index }, value)
    } else {
      return new DecodeFailure(input, DecodeError.expectedMatch(`"${s}" (insensitive)`))
    }
  })
}

/**
 * Helper patterns used in exposed functions.
 */
const {
  letterPattern,
  lettersPattern,
  upperCaseLetterPattern,
  upperCaseLettersPattern,
  lowerCaseLetterPattern,
  lowerCaseLettersPattern,
  digitPattern,
  digitsPattern,
  whitespacePattern,
  optionalWhitespacePattern
} = (() => {
  const testSticky = (() => {
    try {
      return /test/y.sticky
    } catch (_) {
      return false
    }
  })()
  if (testSticky) {
    return {
      letterPattern: /[a-z]/iy,
      lettersPattern: (min: string, max: string) => new RegExp(`[a-z]{${min},${max}}`, 'yi'),
      upperCaseLetterPattern: /[A-Z]/y,
      upperCaseLettersPattern: (min: string, max: string) => new RegExp(`[A-Z]{${min},${max}}`, 'y'),
      lowerCaseLetterPattern: /[a-z]/y,
      lowerCaseLettersPattern: (min: string, max: string) => new RegExp(`[a-z]{${min},${max}}`, 'y'),
      digitPattern: /\d/y,
      digitsPattern: (min: string, max: string) => new RegExp(`[0-9]{${min},${max}}`, 'yi'),
      whitespacePattern: /\s+/y,
      optionalWhitespacePattern: /\s*/y
    }
  } else {
    return {
      letterPattern: /^[a-z]/i,
      lettersPattern: (min: string, max: string) => new RegExp(`^[a-z]{${min},${max}}`, 'i'),
      upperCaseLetterPattern: /^[A-Z]/,
      upperCaseLettersPattern: (min: string, max: string) => new RegExp(`^[A-Z]{${min},${max}}`, ''),
      lowerCaseLetterPattern: /^[a-z]/,
      lowerCaseLettersPattern: (min: string, max: string) => new RegExp(`^[a-z]{${min},${max}}`, ''),
      digitPattern: /^\d/,
      digitsPattern: (min: string, max: string) => new RegExp(`^[0-9]{${min},${max}}`, 'i'),
      whitespacePattern: /^\s+/,
      optionalWhitespacePattern: /^\s*/
    }
  }
})()

/**
 * Match any alphabetical character in a case insensitive matter.
 */
export const letter = regexp(letterPattern).withFailure(DecodeError.expectedOnce(Entity.LETTER))

/**
 * Match a sequence of case-insensitve alphabetical characters. It expects at
 * least one occurance. The boundaries `min` and `max` are both inclusive and
 * optional.
 */
export const letters = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lettersPattern(String(min), maxs)).withFailure(message)
}

/**
 * Match any alphabetical upper-case-character.
 */
export const upperCaseLetter = regexp(upperCaseLetterPattern).withFailure(
  DecodeError.expectedOnce(Entity.UPPERCASE_LETTER)
)

/**
 * Match a sequence of upper-case alphabetical characters. It expects at least
 * one occurance. The boundaries `min` and `max` are both inclusive and optional.
 */
export const upperCaseLetters = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.UPPERCASE_LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(upperCaseLettersPattern(String(min), maxs)).withFailure(message)
}

/**
 * Match any alphabetical lower-ccase-character.
 */
export const lowerCaseLetter = regexp(lowerCaseLetterPattern).withFailure(
  DecodeError.expectedOnce(Entity.LOWER_CASE_LETTER)
)

/**
 * Match a sequence of lower-case alphabetical characters. It expects at least
 * one occurance. The boundaries `min` and `max` are both inclusive and optional.
 */
export const lowerCaseLetters = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.LOWER_CASE_LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure(message)
}

/**
 * Match a single digit character.
 */
export const digit = regexp(digitPattern).withFailure(DecodeError.expectedOnce(Entity.DIGIT))

/**
 * Match a sequence of digit characters. It expects at least one occurance.
 * The boundaries `min` and `max` are both inclusive and optional.
 */
export const digits = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.DIGIT)
  const maxs = max === undefined ? '' : String(max)
  return regexp(digitsPattern(String(min), maxs)).withFailure(message)
}

/**
 * Match a single whitespace character.
 */
export const whitespace = regexp(whitespacePattern).withFailure(DecodeError.expectedAtLeast(1, Entity.WHITESPACE))

/**
 * Match an optional whitespace character. If no whitespace is matched, the result
 * is the empty string `""`.
 */
export const optionalWhitespace = regexp(optionalWhitespacePattern)

/**
 * Decoder that matches one single character. This decoder will only fail if it
 * encounters the `EOI` (end of input).
 */
export const char = make((input: TextInput) => {
  if (input.index < input.input.length) {
    const c = input.input.charAt(input.index)
    return new DecodeSuccess({ ...input, index: input.index + 1 }, c)
  } else {
    // no more characters
    return new DecodeFailure(input, DecodeError.expectedOnce(Entity.CHARACTER))
  }
})

/**
 * Produces a decoder similar to {@link char} but the char is tested through
 * the predicate function `f`. The character value is produced only if the predicate
 * succeeds.
 */
export const testChar = (f: (c: string) => boolean): TextDecoder<string> =>
  make((input: TextInput) => {
    if (input.index >= input.input.length) {
      return new DecodeFailure(input, DecodeError.unexpectedEoi)
    } else {
      const char = input.input.charAt(input.index)
      if (f(char)) {
        return new DecodeSuccess({ ...input, index: input.index + 1 }, char)
      } else {
        return new DecodeFailure(input, DecodeError.expectedOnce(Entity.PREDICATE))
      }
    }
  })

/**
 * Match any single char from a list of possible values `anyOf`.
 */
export const matchAnyCharOf = (anyOf: string): TextDecoder<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0).withFailure(
    DecodeError.expectedAnyOf(Entity.CHARACTER, anyOf.split('').map(v => `"${v}"`))
  )

/**
 * Match any single char that is not included in the list of possible values `noneOf`.
 */
export const matchNoCharOf = (noneOf: string): TextDecoder<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0).withFailure(
    DecodeError.expectedNoneOf(Entity.CHARACTER, noneOf.split('').map(v => `"${v}"`))
  )

/**
 * Take a sequence of char that all satisfy the predicate `f`. It works much like
 * {@link testChar} but for a sequence of charecters. The default is that the
 * decoder should match at least one result. That can be changed by passing
 * the second optional argument `atLeast` with a different value.
 */
export const takeCharWhile = (f: (c: string) => boolean, atLeast = 1): TextDecoder<string> =>
  make((input: TextInput) => {
    let index = input.index
    while (index < input.input.length && f(input.input.charAt(index))) {
      index++
    }
    if (index - input.index < atLeast) {
      return new DecodeFailure(input, DecodeError.expectedAtLeast(atLeast, Entity.PREDICATE))
    } else {
      return new DecodeSuccess({ ...input, index }, input.input.substring(input.index, index))
    }
  })

/**
 * Same as {@link takeCharWhile} but with a minimum (`min`) and maximum (`max`)
 * constraints. They are both inclusive and mandatory.
 */
export const takeCharBetween = (f: (c: string) => boolean, min: number, max: number): TextDecoder<string> =>
  make((input: TextInput) => {
    let index = input.index
    let counter = 0
    while (index < input.input.length && counter < max && f(input.input.charAt(index))) {
      index++
      counter++
    }
    if (counter < min) {
      return new DecodeFailure(input, DecodeError.expectedAtLeast(min, Entity.PREDICATE))
    } else {
      return new DecodeSuccess({ ...input, index }, input.input.substring(input.index, index))
    }
  })

/**
 * Pretty prints a `DecodeFailure<TextInput, Out, DecodeError>`.
 */
export const failureToString = <Out>(err: DecodeFailure<TextInput, Out, DecodeError>): string => {
  const { failures, input } = err
  const msg =
    failures.length === 1 ? failures[0].toString() : `one of:\n * ${failures.map(v => v.toString()).join('\n * ')}\n`
  const length = Math.min(25, Math.max(msg.length, 10), input.input.length - input.index)
  const prefix = input.index === 0 ? '' : '…'
  const suffix = input.index < input.input.length - 1 ? '…' : ''
  const extract = input.input.substr(input.index, length)
  return `expected ${msg} at "${prefix}${extract}${suffix}"`
}
