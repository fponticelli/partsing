import { Parser } from './parser'
import { ParseResult, ParseFailure, ParseSuccess } from './parse_result'

export interface TextInput {
  readonly input: string
  readonly index: number
}

export enum ErrorEntityType {
  CHARACTER = 'character',
  PREDICATE = 'predicate',
  LETTERS = 'letter',
  UPPER_CASE_LETTERS = 'uppercase letter',
  LOWER_CASE_LETTERS = 'lowercase letter',
  DIGITS = 'digit',
  WHITESPACE = 'whitespace'
}

export const pluralize = (entity: ErrorEntityType, qt: number) => {
  if (qt === 1) return String(entity)
  switch (entity) {
    case ErrorEntityType.CHARACTER: return 'characters'
    case ErrorEntityType.PREDICATE: return 'predicates'
    case ErrorEntityType.LETTERS: return 'letters'
    case ErrorEntityType.UPPER_CASE_LETTERS: return 'uppercase letters'
    case ErrorEntityType.LOWER_CASE_LETTERS: return 'lowercase letters'
    case ErrorEntityType.DIGITS: return 'digits'
    case ErrorEntityType.WHITESPACE: return 'whitespaces'
    default: throw new Error('unreacheable code')
  }
}

abstract class TextParserErrorBase {
  toStringWithInput(input: TextInput): string {
    const msg = this.toString()
    const length = Math.min(25, Math.max(msg.length, 10), input.input.length - input.index)
    const prefix = input.index === 0 ? '' : '…'
    const suffix = input.index < input.input.length - 1 ? '…' : ''
    const extract = input.input.substr(input.index, length)
    return `${msg} at "${prefix}${extract}${suffix}"`
  }
  abstract toString(): string
}

export class RegExpError extends TextParserErrorBase {
  readonly kind: 'regexp-error' = 'regexp-error'
  constructor(readonly pattern: RegExp) {
    super()
  }

  toString() {
    return `doesn't match ${this.pattern.source}`
  }
}

export class OneEntityError extends TextParserErrorBase {
  readonly kind: 'one-entity-error' = 'one-entity-error'
  constructor(readonly entity: ErrorEntityType) {
    super()
  }

  toString() {
    return `expected a ${pluralize(this.entity, 1)}`
  }
}

export class UnexpectedEOTError extends TextParserErrorBase {
  readonly kind: 'unexpected-eot-error' = 'unexpected-eot-error'
  constructor() {
    super()
  }

  toString() {
    return `unexpected end of input`
  }
}

export class EOTError extends TextParserErrorBase {
  readonly kind: 'eot-error' = 'eot-error'
  constructor() {
    super()
  }

  toString() {
    return `expected end of input`
  }
}

export class MatchError extends TextParserErrorBase {
  readonly kind: 'match-error' = 'match-error'
  constructor(
    readonly value: string
  ) {
    super()
  }

  toString() {
    return `expected "${this.value}"`
  }
}

export class ExpectedAtLeast extends TextParserErrorBase {
  readonly kind: 'expected-at-least-error' = 'expected-at-least-error'
  constructor(
    readonly min: number,
    readonly entity: ErrorEntityType
  ) {
    super()
  }

  toString() {
    return `expected at least ${this.min} ${pluralize(this.entity, this.min)}`
  }
}

export class CustomError extends TextParserErrorBase {
  readonly kind: 'custom-error' = 'custom-error'
  constructor(
    readonly message: string
  ) {
    super()
  }

  toString() {
    return this.message
  }
}

export class AnyCharOfError extends TextParserErrorBase {
  readonly kind: 'any-char-of-error' = 'any-char-of-error'
  constructor(
    readonly values: string
  ) {
    super()
  }

  toString() {
    return `expected any char of "${this.values}"`
  }
}

export class NoCharOfError extends TextParserErrorBase {
  readonly kind: 'no-char-of-error' = 'no-char-of-error'
  constructor(
    readonly values: string
  ) {
    super()
  }

  toString() {
    return `expected no char of "${this.values}"`
  }
}

export class FailedMatchingError extends TextParserErrorBase {
  readonly kind: 'failed-matching-error' = 'failed-matching-error'
  constructor(
    readonly entity: ErrorEntityType
  ) {
    super()
  }

  toString() {
    return `failed matching ${pluralize(this.entity, 1)}`
  }
}

export class OptionalError extends TextParserErrorBase {
  readonly kind: 'optional-error' = 'optional-error'
  constructor(
    readonly entity: ErrorEntityType
  ) {
    super()
  }

  toString() {
    return `expected optional ${pluralize(this.entity, 1)}`
  }
}

export type TextParserError
  = RegExpError
  | EOTError
  | MatchError
  | ExpectedAtLeast
  | CustomError
  | AnyCharOfError
  | NoCharOfError
  | OneEntityError
  | UnexpectedEOTError
  | FailedMatchingError
  | OptionalError

export const TextParserError = {
  regExp: (pattern: RegExp) => new RegExpError(pattern),
  eot: new EOTError(),
  match: (value: string) => new MatchError(value),
  expectedAtLeast: (min: number, entity: ErrorEntityType) => new ExpectedAtLeast(min, entity),
  anyCharOf: (values: string) => new AnyCharOfError(values),
  noCharOf: (values: string) => new NoCharOfError(values),
  custom: (value: string) => new CustomError(value),
  one: (entity: ErrorEntityType) => new OneEntityError(entity),
  unexpectedEot: new UnexpectedEOTError(),
  failedMatching: (entity: ErrorEntityType) => new FailedMatchingError(entity),
  optional: (entity: ErrorEntityType) => new OptionalError(entity)
}

export type TextParser<T> = Parser<TextInput, T, TextParserError>

const make = <T>(f: (input: TextInput) => ParseResult<TextInput, T, TextParserError>): TextParser<T> =>
  new Parser<TextInput, T, TextParserError>(f)

export const parseText = <T>(parser: TextParser<T>, input: string): ParseResult<TextInput, T, TextParserError> =>
  parser.run({ input, index: 0})

export const regexp = (pattern: RegExp, group = 0): TextParser<string> => {
  if (pattern.sticky) {
    return make((input: TextInput) => {
      pattern.lastIndex = input.index
      const res = pattern.exec(input.input)
      if (res == null) {
        return new ParseFailure(input, TextParserError.regExp(pattern))
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
        return new ParseFailure(input, TextParserError.regExp(pattern))
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
        return new ParseFailure(input, TextParserError.regExp(pattern))
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
      return new ParseFailure(input, TextParserError.eot)
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
      return new ParseFailure(input, TextParserError.match(s))
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

export const letter = regexp(letterPattern).withFailure<TextParserError>(TextParserError.one(ErrorEntityType.LETTERS))

export const letters = (min = 1, max?: number): TextParser<string> => {
  const message = TextParserError.expectedAtLeast(min, ErrorEntityType.LETTERS)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lettersPattern(String(min), maxs)).withFailure<TextParserError>(message)
}

export const upperCaseLetter = regexp(upperCaseLetterPattern)
  .withFailure<TextParserError>(TextParserError.one(ErrorEntityType.UPPER_CASE_LETTERS))

export const upperCaseLetters = (min = 1, max?: number): TextParser<string> => {
  const message = TextParserError.expectedAtLeast(min, ErrorEntityType.UPPER_CASE_LETTERS)
  const maxs = max === undefined ? '' : String(max)
  return regexp(upperCaseLettersPattern(String(min), maxs)).withFailure<TextParserError>(message)
}

export const lowerCaseLetter = regexp(lowerCaseLetterPattern)
  .withFailure<TextParserError>(TextParserError.one(ErrorEntityType.LOWER_CASE_LETTERS))

export const lowerCaseLetters = (min = 1, max?: number): TextParser<string> => {
  const message = TextParserError.expectedAtLeast(min, ErrorEntityType.LOWER_CASE_LETTERS)
  const maxs = max === undefined ? '' : String(max)
  return regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure<TextParserError>(message)
}

export const digit = regexp(digitPattern).withFailure<TextParserError>(TextParserError.one(ErrorEntityType.DIGITS))

export const digits = (min = 1, max?: number): TextParser<string> => {
  const message = TextParserError.expectedAtLeast(min, ErrorEntityType.DIGITS)
  const maxs = max === undefined ? '' : String(max)
  return regexp(digitsPattern(String(min), maxs)).withFailure<TextParserError>(message)
}

export const whitespace = regexp(whitespacePattern)
  .withFailure<TextParserError>(TextParserError.expectedAtLeast(1, ErrorEntityType.WHITESPACE))

export const optionalWhitespace = regexp(optionalWhitespacePattern)
  .withFailure<TextParserError>(TextParserError.optional(ErrorEntityType.WHITESPACE))

export const char = make((input: TextInput) => {
    if (input.index < input.input.length) {
      const c = input.input.charAt(input.index)
      return new ParseSuccess({ ...input, index: input.index + 1 }, c)
    } else {
      // no more characters
      return new ParseFailure(input, TextParserError.one(ErrorEntityType.CHARACTER))
    }
  })

export const testChar = (f: (c: string) => boolean): TextParser<string> =>
  make((input: TextInput) => {
    if (input.index >= input.input.length) {
      return new ParseFailure(input, TextParserError.unexpectedEot)
    } else {
      const char = input.input.charAt(input.index)
      if (f(char)) {
        return new ParseSuccess({...input, index: input.index + 1}, char)
      } else {
        return new ParseFailure(input, TextParserError.failedMatching(ErrorEntityType.PREDICATE))
      }
    }
  })

export const matchAnyCharOf = (anyOf: string): TextParser<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0).withFailure<TextParserError>(TextParserError.anyCharOf(anyOf))

export const matchNoCharOf = (noneOf: string): TextParser<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0).withFailure<TextParserError>(TextParserError.noCharOf(noneOf))

export const takeCharWhile = (f: (c: string) => boolean, atLeast = 1): TextParser<string> =>
  make((input: TextInput) => {
    let index = input.index
    while (index < input.input.length && f(input.input.charAt(index))) {
      index++
    }
    if (index - input.index < atLeast) {
      return new ParseFailure(input, TextParserError.expectedAtLeast(atLeast, ErrorEntityType.PREDICATE))
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
      return new ParseFailure(input, TextParserError.expectedAtLeast(min, ErrorEntityType.PREDICATE))
    } else {
      return new ParseSuccess({...input, index }, input.input.substring(input.index, index))
    }
  })
