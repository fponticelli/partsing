import { Parser, ParseFailure, ParseSuccess, ParseResult } from './parse'

export interface TextSource {
  source: string
  index: number
}

export interface TextFailure extends TextSource {
  expected: string
}

export type TextParser<T> = Parser<TextSource, T, TextFailure>

const make = <T>(f: (source: TextSource) => ParseResult<T, TextFailure, TextSource>): TextParser<T> => new Parser<TextSource, T, TextFailure>(f)

export const regexp = (pattern: RegExp, group = 0): TextParser<string> =>
  make((source: TextSource) => {
    const res = pattern.exec(source.source.substring(source.index))
    if (res == null) {
      return new ParseFailure(source, { ...source, expected: pattern.toString() })
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

export const eot = (): TextParser<unknown> =>
  make(source => {
    const index = source.source.length
    if (source.index === index) {
      return new ParseSuccess({ ...source, index }, undefined)
    } else {
      return new ParseFailure(source, { ...source, expected: 'EOT' })
    }
  })

export const match = <V extends string>(s: V): TextParser<string> => {
  const length = s.length
  return make(source => {
    const index = source.index + length
    const value = source.source.substring(source.index, index)
    if (value === s) {
      return new ParseSuccess({ ...source, index }, s)
    } else {
      return new ParseFailure(source, { ...source, expected: s })
    }
  })
}

export const expect = <T>(expected: string, parser: TextParser<T>) =>
  make(source => parser.run(source).mapError(f => ({ ...f, expected })))

export const parse = <T>(parser: TextParser<T>, source: string): ParseResult<T, TextFailure, TextSource> =>
  parser.run({ source, index: 0})

export const lazy = <T>(f: () => TextParser<T>) => {
  let parser: TextParser<T> | undefined
  return make(source => {
    if (parser === undefined)
      parser = f()
    return parser.run(source)
  })
}

const parser = regexp(/[abc]{1,2}/g)
  .then(regexp(/[abc]{1,2}/g))
  .then(index())

console.log(parse(parser, '123a12c3'))