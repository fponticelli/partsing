import { Parser, seq, alt } from './parser'
import { ParseResult, ParseFailure, ParseSuccess } from './parse_result'

export interface TextSource {
  source: string
  index: number
}

export interface TextFailure {
  expected: string
}

export type TextParser<T> = Parser<T, TextFailure, TextSource>

const make = <T>(f: (source: TextSource) => ParseResult<T, TextFailure, TextSource>): TextParser<T> =>
  new Parser<T, TextFailure, TextSource>(f)

export const expect = <T>(expected: string, parser: TextParser<T>) =>
  make(source => parser.run(source).mapError(f => ({ ...f, expected })))

export const parse = <T>(parser: TextParser<T>, source: string): ParseResult<T, TextFailure, TextSource> =>
  parser.run({ source, index: 0})

export const regexp = (pattern: RegExp, group = 0): TextParser<string> =>
  make((source: TextSource) => {
    const res = pattern.exec(source.source.substring(source.index))
    if (res == null) {
      return new ParseFailure(source, { expected: pattern.toString() })
    } else {
      const index = source.index + pattern.lastIndex
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
      return new ParseFailure(source, { expected: 'EOT' })
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
      return new ParseFailure(source, { expected: `"${s}"` })
    }
  })
}

export const letter = (): TextParser<string> =>
  expect('one letter', regexp(/^[a-z]/gi))

export const letters = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} letter(s)` : `between ${min} and ${max} letter(s)`
  const maxs = max === undefined ? '' : String(max)
  return expect(message, regexp(new RegExp(`^[a-z]{${min},${maxs}}`, 'gi')))
}

export const digit = (): TextParser<string> =>
  expect('one digit', regexp(/^\d/gi))

export const digits = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} digit(s)` : `between ${min} and ${max} digit(s)`
  const maxs = max === undefined ? '' : String(max)
  return expect(message, regexp(new RegExp(`^[0-9]{${min},${maxs}}`, 'gi')))
}

export const whitespace = (): TextParser<string> =>
  expect('whitespace', regexp(/^\s+/g))

export const optionalWhitespace = (): TextParser<string> =>
  expect('optional whitespace', regexp(/^\s*/g))

export const char = (): TextParser<string> =>
  make((source: TextSource) => {
    if (source.index < source.source.length) {
      const c = source.source.charAt(source.index)
      return new ParseSuccess({ ...source, index: source.index + 1 }, c)
    } else {
      // no more characters
      return new ParseFailure(source, { expected: 'a character' })
    }
  })

export const testChar = (f: (c: string) => boolean): TextParser<string> =>
  make((source: TextSource) => {
    if (source.index < source.source.length) {
      return new ParseFailure(source, { expected: 'expected to test char but reached end of source' })
    } else {
      const char = source.source.charAt(source.index)
      if (f(char)) {
        return new ParseSuccess({...source, index: source.index + 1}, char)
      } else {
        return new ParseFailure(source, { expected: 'failed matching char predicate' })
      }
    }
  })

export const matchOneOf = (anyOf: string): TextParser<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0)

export const matchNoneOf = (noneOf: string): TextParser<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0)

export const takeWhile = (f: (c: string) => boolean, atLeast = 1): TextParser<string> =>
  make((source: TextSource) => {
    let index = source.index
    while (index < source.source.length && f(source.source.charAt(index))) {
      index++
    }
    if (index - source.index < atLeast) {
      return new ParseFailure(source, { expected: `expected at least ${atLeast} occurrances of predicate` })
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
    return new ParseFailure(source, { expected: `expected at least ${counter} occurrances of predicate` })
  } else {
    return new ParseSuccess({...source, index }, source.source.substring(source.index, index))
  }
})
