import { TextInput } from './input'

export enum Entity {
  CHARACTER = 'character',
  PREDICATE = 'predicate',
  LETTERS = 'letter',
  UPPER_CASE_LETTERS = 'uppercase letter',
  LOWER_CASE_LETTERS = 'lowercase letter',
  DIGITS = 'digit',
  WHITESPACE = 'whitespace'
}

export const pluralize = (entity: Entity, qt: number) => {
  if (qt === 1)
    return String(entity)
  switch (entity) {
    case Entity.CHARACTER: return 'characters'
    case Entity.PREDICATE: return 'predicates'
    case Entity.LETTERS: return 'letters'
    case Entity.UPPER_CASE_LETTERS: return 'uppercase letters'
    case Entity.LOWER_CASE_LETTERS: return 'lowercase letters'
    case Entity.DIGITS: return 'digits'
    case Entity.WHITESPACE: return 'whitespaces'
    default: throw new Error('unreacheable code')
  }
}

abstract class TextErrorBase {
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

export class RegExpError extends TextErrorBase {
  readonly kind: 'regexp-error' = 'regexp-error'
  constructor(readonly pattern: RegExp) {
    super()
  }
  toString() {
    return `doesn't match ${this.pattern.source}`
  }
}

export class OneEntityError extends TextErrorBase {
  readonly kind: 'one-entity-error' = 'one-entity-error'
  constructor(readonly entity: Entity) {
    super()
  }
  toString() {
    return `expected a ${pluralize(this.entity, 1)}`
  }
}

export class UnexpectedEOTError extends TextErrorBase {
  readonly kind: 'unexpected-eot-error' = 'unexpected-eot-error'
  constructor() {
    super()
  }
  toString() {
    return `unexpected end of input`
  }
}

export class ExpectedEOTError extends TextErrorBase {
  readonly kind: 'expected-eot-error' = 'expected-eot-error'
  constructor() {
    super()
  }
  toString() {
    return `expected end of input`
  }
}

export class MatchError extends TextErrorBase {
  readonly kind: 'match-error' = 'match-error'
  constructor(readonly value: string) {
    super()
  }
  toString() {
    return `expected "${this.value}"`
  }
}

export class ExpectedAtLeast extends TextErrorBase {
  readonly kind: 'expected-at-least-error' = 'expected-at-least-error'
  constructor(readonly min: number, readonly entity: Entity) {
    super()
  }
  toString() {
    return `expected at least ${this.min} ${pluralize(this.entity, this.min)}`
  }
}

export class CustomError extends TextErrorBase {
  readonly kind: 'custom-error' = 'custom-error'
  constructor(readonly message: string) {
    super()
  }
  toString() {
    return this.message
  }
}

export class AnyCharOfError extends TextErrorBase {
  readonly kind: 'any-char-of-error' = 'any-char-of-error'
  constructor(readonly values: string) {
    super()
  }
  toString() {
    return `expected any char of "${this.values}"`
  }
}

export class NoCharOfError extends TextErrorBase {
  readonly kind: 'no-char-of-error' = 'no-char-of-error'
  constructor(readonly values: string) {
    super()
  }
  toString() {
    return `expected no char of "${this.values}"`
  }
}

export class FailedMatchingError extends TextErrorBase {
  readonly kind: 'failed-matching-error' = 'failed-matching-error'
  constructor(readonly entity: Entity) {
    super()
  }
  toString() {
    return `failed matching ${pluralize(this.entity, 1)}`
  }
}

export class OptionalError extends TextErrorBase {
  readonly kind: 'optional-error' = 'optional-error'
  constructor(readonly entity: Entity) {
    super()
  }
  toString() {
    return `expected optional ${pluralize(this.entity, 1)}`
  }
}

export type TextError
  = RegExpError
  | ExpectedEOTError
  | MatchError
  | ExpectedAtLeast
  | CustomError
  | AnyCharOfError
  | NoCharOfError
  | OneEntityError
  | UnexpectedEOTError
  | FailedMatchingError
  | OptionalError

export const TextError = {
  regExp: (pattern: RegExp) => new RegExpError(pattern) as TextError,
  eot: new ExpectedEOTError() as TextError,
  match: (value: string) => new MatchError(value) as TextError,
  expectedAtLeast: (min: number, entity: Entity) => new ExpectedAtLeast(min, entity) as TextError,
  anyCharOf: (values: string) => new AnyCharOfError(values) as TextError,
  noCharOf: (values: string) => new NoCharOfError(values) as TextError,
  custom: (value: string) => new CustomError(value) as TextError,
  one: (entity: Entity) => new OneEntityError(entity) as TextError,
  unexpectedEot: new UnexpectedEOTError() as TextError,
  failedMatching: (entity: Entity) => new FailedMatchingError(entity) as TextError,
  optional: (entity: Entity) => new OptionalError(entity) as TextError
}