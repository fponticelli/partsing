import { Parser, ParseFailure, ParseSuccess, ParseResult } from './parse';

export interface TextSource {
  source: string
  index: number
}

export interface TextFailure {
  expected: string
}

export class TextParser<T> extends Parser<TextSource, T, TextFailure> {
  static regexp(pattern: RegExp, group = 0) {
    return new TextParser((source: TextSource) => {
      const res = pattern.exec(source.source.substring(source.index))
      if (res == null) {
        return new ParseFailure(source, { expected: pattern.toString() })
      } else {
        const index = source.index + pattern.lastIndex
        console.log(pattern.lastIndex, index, pattern)
        return new ParseSuccess({...source, index}, res[group])
      }
    })   
  }
  static parse<T>(parser: Parser<TextSource, T, TextFailure>, source: string): ParseResult<T, TextFailure, TextSource> {
    return parser.run({ source, index: 0})
  }
}

const parser = TextParser.regexp(/[abc]{1,2}/g).then(TextParser.regexp(/[abc]{1,2}/g))

console.log(TextParser.parse(parser, '123a12c3'))