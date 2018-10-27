import { Parser, sequence, oneOf } from './parser'
import { ParseResult, ParseFailure, ParseSuccess } from './parse_result'

export interface TextSource {
  readonly source: string
  readonly index: number
}

export type TextParser<T> = Parser<T, string, TextSource>

const make = <T>(f: (source: TextSource) => ParseResult<T, string, TextSource>): TextParser<T> =>
  new Parser<T, string, TextSource>(f)

export const parseText = <T>(parser: TextParser<T>, source: string): ParseResult<T, string, TextSource> =>
  parser.run({ source, index: 0})

export const regexp = (pattern: RegExp, group = 0): TextParser<string> =>
  make((source: TextSource) => {
    const s = source.source.substring(source.index)
    pattern.lastIndex = 0
    const res = pattern.exec(s)
    if (res == null) {
      return new ParseFailure(source, pattern.toString())
    } else {
      const index = source.index + (pattern.global ? pattern.lastIndex : s.indexOf(res[0]) + res[0].length)
      return new ParseSuccess({ ...source, index }, res[group])
    }
  })

export const index = (): TextParser<number> =>
  make(source => new ParseSuccess(source, source.index))

export const rest = (): TextParser<string> =>
  make(source => {
    const value = source.source.substring(source.index)
    return new ParseSuccess({ ...source, index: source.source.length }, value)
  })

export const eot = (): TextParser<undefined> =>
  make(source => {
    const index = source.source.length
    if (source.index === index) {
      return new ParseSuccess({ ...source, index }, undefined)
    } else {
      return new ParseFailure(source, 'EOT')
    }
  })

export const match = <V extends string>(s: V): TextParser<V> => {
  const length = s.length
  return make(source => {
    const index = source.index + length
    const value = source.source.substring(source.index, index)
    if (value === s) {
      return new ParseSuccess({ ...source, index }, s)
    } else {
      return new ParseFailure(source, `"${s}"`)
    }
  })
}

export const letter = (): TextParser<string> =>
  regexp(/^[a-z]/i).withFailure('one letter')

export const letters = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} letter(s)` : `between ${min} and ${max} letter(s)`
  const maxs = max === undefined ? '' : String(max)
  return regexp(new RegExp(`^[a-z]{${min},${maxs}}`, 'i')).withFailure(message)
}

export const digit = (): TextParser<string> =>
  regexp(/^\d/).withFailure('one digit')

export const digits = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} digit(s)` : `between ${min} and ${max} digit(s)`
  const maxs = max === undefined ? '' : String(max)
  return regexp(new RegExp(`^[0-9]{${min},${maxs}}`, '')).withFailure(message)
}

export const whitespace = (): TextParser<string> =>
  regexp(/^\s+/).withFailure('whitespace')

export const optionalWhitespace = (): TextParser<string> =>
  regexp(/^\s*/).withFailure('optional whitespace')

export const char = (): TextParser<string> =>
  make((source: TextSource) => {
    if (source.index < source.source.length) {
      const c = source.source.charAt(source.index)
      return new ParseSuccess({ ...source, index: source.index + 1 }, c)
    } else {
      // no more characters
      return new ParseFailure(source, 'a character')
    }
  })

export const testChar = (f: (c: string) => boolean): TextParser<string> =>
  make((source: TextSource) => {
    if (source.index >= source.source.length) {
      return new ParseFailure(source, 'to test char but reached end of source')
    } else {
      const char = source.source.charAt(source.index)
      if (f(char)) {
        return new ParseSuccess({...source, index: source.index + 1}, char)
      } else {
        return new ParseFailure(source, 'failed matching char predicate')
      }
    }
  })

export const matchOneOf = (anyOf: string): TextParser<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0).withFailure(`expected one of \`${anyOf}\``)

export const matchNoneOf = (noneOf: string): TextParser<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0).withFailure(`expected none of \`${noneOf}\``)

export const takeWhile = (f: (c: string) => boolean, atLeast = 1): TextParser<string> =>
  make((source: TextSource) => {
    let index = source.index
    while (index < source.source.length && f(source.source.charAt(index))) {
      index++
    }
    if (index - source.index < atLeast) {
      return new ParseFailure(source, `expected at least ${atLeast} occurrance(s) of predicate`)
    } else {
      return new ParseSuccess({...source, index }, source.source.substring(source.index, index))
    }
  })

export const takeBetween = (f: (c: string) => boolean, min: number, max: number): TextParser<string> =>
  make((source: TextSource) => {
    let index = source.index
    let counter = 0
    while (index < source.source.length && counter < max && f(source.source.charAt(index))) {
      index++
      counter++
    }
    if (counter < min) {
      return new ParseFailure(source, `expected at least ${min} occurrance(s) of predicate`)
    } else {
      return new ParseSuccess({...source, index }, source.source.substring(source.index, index))
    }
  })
