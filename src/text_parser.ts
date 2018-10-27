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

export const regexp = (pattern: RegExp, group = 0): TextParser<string> => {
  if (pattern.sticky) {
    return make((source: TextSource) => {
      pattern.lastIndex = source.index
      const res = pattern.exec(source.source)
      if (res == null) {
        return new ParseFailure(source, pattern.toString())
      } else {
        return new ParseSuccess({ ...source, index: pattern.lastIndex }, res[group])
      }
    })
  } else if (pattern.global) {
    return make((source: TextSource) => {
      const s = source.source.substring(source.index)
      pattern.lastIndex = 0
      const res = pattern.exec(s)
      if (res == null) {
        return new ParseFailure(source, pattern.toString())
      } else {
        const index = source.index + pattern.lastIndex
        return new ParseSuccess({ ...source, index }, res[group])
      }
    })
  } else {
    return make((source: TextSource) => {
      const s = source.source.substring(source.index)
      pattern.lastIndex = 0
      const res = pattern.exec(s)
      if (res == null) {
        return new ParseFailure(source, pattern.toString())
      } else {
        const index = source.index + s.indexOf(res[0]) + res[0].length
        return new ParseSuccess({ ...source, index }, res[group])
      }
    })
  }
}

export const withPosition = (): TextParser<number> =>
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
  const t = /test/y
  if (t.sticky === true) {
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

export const letter = (): TextParser<string> =>
  regexp(letterPattern).withFailure('one letter')

export const letters = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} letter(s)` : `between ${min} and ${max} letter(s)`
  const maxs = max === undefined ? '' : String(max)
  return regexp(lettersPattern(String(min), maxs)).withFailure(message)
}

export const upperCaseLetter = (): TextParser<string> =>
  regexp(upperCaseLetterPattern).withFailure('one letter')

export const upperCaseLetters = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} letter(s)` : `between ${min} and ${max} letter(s)`
  const maxs = max === undefined ? '' : String(max)
  return regexp(upperCaseLettersPattern(String(min), maxs)).withFailure(message)
}

export const lowerCaseLetter = (): TextParser<string> =>
  regexp(lowerCaseLetterPattern).withFailure('one letter')

export const lowerCaseLetters = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} letter(s)` : `between ${min} and ${max} letter(s)`
  const maxs = max === undefined ? '' : String(max)
  return regexp(lowerCaseLettersPattern(String(min), maxs)).withFailure(message)
}

export const digit = (): TextParser<string> =>
  regexp(digitPattern).withFailure('one digit')

export const digits = (min = 1, max?: number): TextParser<string> => {
  const message = max === undefined ? `at least ${min} digit(s)` : `between ${min} and ${max} digit(s)`
  const maxs = max === undefined ? '' : String(max)
  return regexp(digitsPattern(String(min), maxs)).withFailure(message)
}

export const whitespace = (): TextParser<string> =>
  regexp(whitespacePattern).withFailure('whitespace')

export const optionalWhitespace = (): TextParser<string> =>
  regexp(optionalWhitespacePattern).withFailure('optional whitespace')

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

export const matchAnyCharOf = (anyOf: string): TextParser<string> =>
  testChar((c: string) => anyOf.indexOf(c) >= 0).withFailure(`expected any char of \`${anyOf}\``)

export const matchNoCharOf = (noneOf: string): TextParser<string> =>
  testChar((c: string) => noneOf.indexOf(c) < 0).withFailure(`expected none of \`${noneOf}\` chars`)

export const takeCharWhile = (f: (c: string) => boolean, atLeast = 1): TextParser<string> =>
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

export const takeCharBetween = (f: (c: string) => boolean, min: number, max: number): TextParser<string> =>
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
