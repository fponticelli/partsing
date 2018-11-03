import { Parser } from '../core/parser'
import { ParseResult, ParseFailure, ParseSuccess } from '../core/result'
import { DecodeError } from '../error'
import { Entity } from '../error'
import { TextInput } from './input'

export type TextParser<T> = Parser<TextInput, T, DecodeError>

const make = <T>(f: (input: TextInput) => ParseResult<TextInput, T, DecodeError>): TextParser<T> =>
  new Parser<TextInput, T, DecodeError>(f)

export const parseText = <T>(parser: TextParser<T>, input: string): ParseResult<TextInput, T, DecodeError> =>
  parser.run({ input, index: 0})

export const regexp = (pattern: RegExp, group = 0): TextParser<string> => {
  if (pattern.sticky) {
    return make((input: TextInput) => {
      pattern.lastIndex = input.index
      const res = pattern.exec(input.input)
      if (res == null) {
        return new ParseFailure(input, DecodeError.patternMismatch(pattern.source))
      } else {
        return new ParseSuccess({ ...input, index: pattern.lastIndex }, res[group])
      }
    })
  } else if (pattern.global) {
    return make((input: TextInput) => {
      const s = input.input.substring(input.index)
      pattern.lastIndex = 0
      const res = pattern.exec(s)
      if (res == null) {
        return new ParseFailure(input, DecodeError.patternMismatch(pattern.source))
      } else {
        const index = input.index + pattern.lastIndex
        return new ParseSuccess({ ...input, index }, res[group])
      }
    })
  } else {
    return make((input: TextInput) => {
      const s = input.input.substring(input.index)
      pattern.lastIndex = 0
      const res = pattern.exec(s)
      if (res == null) {
        return new ParseFailure(input, DecodeError.patternMismatch(pattern.source))
      } else {
        const index = input.index + s.indexOf(res[0]) + res[0].length
        return new ParseSuccess({ ...input, index }, res[group])
      }
    })
  }
}

export const withPosition = make(input => new ParseSuccess(input, input.index))

export const rest = make(input => {
    const value = input.input.substring(input.index)
    return new ParseSuccess({ ...input, index: input.input.length }, value)
  })

export const eot = make(input => {
    const index = input.input.length
    if (input.index === index) {
      return new ParseSuccess({ ...input, index }, undefined)
    } else {
      return new ParseFailure(input, DecodeError.expectedEot)
    }
  })

export const match = <V extends string>(s: V): TextParser<V> => {
  const length = s.length
  return make(input => {
    const index = input.index + length
    const value = input.input.substring(input.index, index)
    if (value === s) {
      return new ParseSuccess({ ...input, index }, s)
    } else {
      return new ParseFailure(input, DecodeError.expectedMatch(s))
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

export const letters = (min = 1, max?: number): TextParser<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lettersPattern(String(min), maxs)).withFailure(message)
}

export const upperCaseLetter = regexp(upperCaseLetterPattern)
  .withFailure(DecodeError.expectedOnce(Entity.UPPER_CASE_LETTER))

export const upperCaseLetters = (min = 1, max?: number): TextParser<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.UPPER_CASE_LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(upperCaseLettersPattern(String(min), maxs)).withFailure(message)
}

export const lowerCaseLetter = regexp(lowerCaseLetterPattern)
  .withFailure(DecodeError.expectedOnce(Entity.LOWER_CASE_LETTER))

export const lowerCaseLetters = (min = 1, max?: number): TextParser<string> => {
  const message = DecodeError.expectedAtLeast(min, Entity.LOWER_CASE_LETTER)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure(message)
}

export const digit = regexp(digitPattern).withFailure(DecodeError.expectedOnce(Entity.DIGIT))

export const digits = (min = 1, max?: number): TextParser<string> => {
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
      return new ParseSuccess({ ...input, index: input.index + 1 }, c)
    } else {
      // no more characters
      return new ParseFailure(input, DecodeError.expectedOnce(Entity.CHARACTER))
    }
  })

export const testChar = (f: (c: string) => boolean): TextParser<string> =>
  make((input: TextInput) => {
    if (input.index >= input.input.length) {
      return new ParseFailure(input, DecodeError.unexpectedEoi)
    } else {
      const char = input.input.charAt(input.index)
      if (f(char)) {
        return new ParseSuccess({...input, index: input.index + 1}, char)
      } else {
        return new ParseFailure(input, DecodeError.expectedOnce(Entity.PREDICATE))
      }
    }
  })

export const matchAnyCharOf = (anyOf: string): TextParser<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0).withFailure(DecodeError.expectedAnyOf(
    Entity.CHARACTER,
    anyOf.split('').map(v => `"${v}"`)))

export const matchNoCharOf = (noneOf: string): TextParser<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0).withFailure(DecodeError.expectedNoneOf(
    Entity.CHARACTER,
    noneOf.split('').map(v => `"${v}"`)))

export const takeCharWhile = (f: (c: string) => boolean, atLeast = 1): TextParser<string> =>
  make((input: TextInput) => {
    let index = input.index
    while (index < input.input.length && f(input.input.charAt(index))) {
      index++
    }
    if (index - input.index < atLeast) {
      return new ParseFailure(input, DecodeError.expectedAtLeast(atLeast, Entity.PREDICATE))
    } else {
      return new ParseSuccess({...input, index }, input.input.substring(input.index, index))
    }
  })

export const takeCharBetween = (f: (c: string) => boolean, min: number, max: number): TextParser<string> =>
  make((input: TextInput) => {
    let index = input.index
    let counter = 0
    while (index < input.input.length && counter < max && f(input.input.charAt(index))) {
      index++
      counter++
    }
    if (counter < min) {
      return new ParseFailure(input, DecodeError.expectedAtLeast(min, Entity.PREDICATE))
    } else {
      return new ParseSuccess({...input, index }, input.input.substring(input.index, index))
    }
  })
