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
import { DecodeFailure, DecodeResult, DecodeSuccess } from '../core/result'
import { DecodeError, Entity } from '../error'
import { TextInput } from './input'

export type TextDecoder<T> = Decoder<TextInput, T, DecodeError>

const make = <T>(f: Decoding<TextInput, T, DecodeError>): TextDecoder<T> =>
  Decoder.of<TextInput, T, DecodeError>(f)

export const decodeText = <T>(decoder: TextDecoder<T>) => (input: string): DecodeResult<string, T, string> =>
  decoder.run({ input, index: 0})
    .match({
      success: (r) => DecodeResult.success(input, r.value),
      failure: (f) => DecodeResult.failure(input, failureToString(f))
    })

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

export const withPosition = make(input => new DecodeSuccess(input, input.index))

export const rest = make(input => {
    const value = input.input.substring(input.index)
    return new DecodeSuccess({ ...input, index: input.input.length }, value)
  })

export const eoi: Decoder<TextInput, void, DecodeError> = make(input => {
    const index = input.input.length
    if (input.index === index) {
      return new DecodeSuccess({ ...input, index }, undefined)
    } else {
      return new DecodeFailure(input, DecodeError.expectedEot)
    }
  })

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
      letterPattern: /[a-z]/yi,
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

export const letter = regexp(letterPattern).withFailure(DecodeError.expectedOnce(Entity.LETTER))

export const letters = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lettersPattern(String(min), maxs)).withFailure(message)
}

export const upperCaseLetter = regexp(upperCaseLetterPattern)
  .withFailure(DecodeError.expectedOnce(Entity.UPPERCASE_LETTER))

export const upperCaseLetters = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.UPPERCASE_LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(upperCaseLettersPattern(String(min), maxs)).withFailure(message)
}

export const lowerCaseLetter = regexp(lowerCaseLetterPattern)
  .withFailure(DecodeError.expectedOnce(Entity.LOWER_CASE_LETTER))

export const lowerCaseLetters = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.LOWER_CASE_LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure(message)
}

export const digit = regexp(digitPattern).withFailure(DecodeError.expectedOnce(Entity.DIGIT))

export const digits = (min = 1, max?: number): TextDecoder<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.DIGIT)
  const maxs = max === undefined ? '' : String(max)
  return regexp(digitsPattern(String(min), maxs)).withFailure(message)
}

export const whitespace = regexp(whitespacePattern)
  .withFailure(DecodeError.expectedAtLeast(1, Entity.WHITESPACE))

export const optionalWhitespace = regexp(optionalWhitespacePattern)

export const char = make((input: TextInput) => {
    if (input.index < input.input.length) {
      const c = input.input.charAt(input.index)
      return new DecodeSuccess({ ...input, index: input.index + 1 }, c)
    } else {
      // no more characters
      return new DecodeFailure(input, DecodeError.expectedOnce(Entity.CHARACTER))
    }
  })

export const testChar = (f: (c: string) => boolean): TextDecoder<string> =>
  make((input: TextInput) => {
    if (input.index >= input.input.length) {
      return new DecodeFailure(input, DecodeError.unexpectedEoi)
    } else {
      const char = input.input.charAt(input.index)
      if (f(char)) {
        return new DecodeSuccess({...input, index: input.index + 1}, char)
      } else {
        return new DecodeFailure(input, DecodeError.expectedOnce(Entity.PREDICATE))
      }
    }
  })

export const matchAnyCharOf = (anyOf: string): TextDecoder<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0).withFailure(DecodeError.expectedAnyOf(
    Entity.CHARACTER,
    anyOf.split('').map(v => `"${v}"`)))

export const matchNoCharOf = (noneOf: string): TextDecoder<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0).withFailure(DecodeError.expectedNoneOf(
    Entity.CHARACTER,
    noneOf.split('').map(v => `"${v}"`)))

export const takeCharWhile = (f: (c: string) => boolean, atLeast = 1): TextDecoder<string> =>
  make((input: TextInput) => {
    let index = input.index
    while (index < input.input.length && f(input.input.charAt(index))) {
      index++
    }
    if (index - input.index < atLeast) {
      return new DecodeFailure(input, DecodeError.expectedAtLeast(atLeast, Entity.PREDICATE))
    } else {
      return new DecodeSuccess({...input, index }, input.input.substring(input.index, index))
    }
  })

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
      return new DecodeSuccess({...input, index }, input.input.substring(input.index, index))
    }
  })

export const failureToString = <Out>(err: DecodeFailure<TextInput, Out, DecodeError>): string => {
  const { failure, input } = err
  const msg = failure.toString()
  const length = Math.min(25, Math.max(msg.length, 10), input.input.length - input.index)
  const prefix = input.index === 0 ? '' : '…'
  const suffix = input.index < input.input.length - 1 ? '…' : ''
  const extract = input.input.substr(input.index, length)
  return `${msg} at "${prefix}${extract}${suffix}"`
}
