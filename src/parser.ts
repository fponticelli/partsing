import { ParseResult, ParseFailure, ParseSuccess } from './parse_result'

export type Parsing<Result, Failure, Source> = (source: Source) => ParseResult<Result, Failure, Source>

export class Parser<Result, Failure, Source> {
  static of<Result, Failure, Source>(run: (source: Source) => ParseResult<Result, Failure, Source>) {
    return new Parser(run)
  }

  static ofGuaranteed<Result, Failure, Source>(run: (source: Source) => [Source, Result]) {
    return new Parser((source: Source) =>
      ParseResult.success<Result, Failure, Source>(...run(source))
    )
  }

  constructor(readonly run: (source: Source) => ParseResult<Result, Failure, Source>) {}

  flatMap<Dest>(fun: (res: Result) => Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source> {
    return new Parser<Dest, Failure, Source>((source: Source) => {
      return this.run(source).match<ParseResult<Dest, Failure, Source>>({
        failure: (f: ParseFailure<Result, Failure, Source>) => new ParseFailure(f.source, f.failure),
        success: (s: ParseSuccess<Result, Failure, Source>) => fun(s.value).run(s.source)
      })
    })
  }
  
  map<Dest>(fun: (res: Result) => Dest): Parser<Dest, Failure, Source> {
    return this.flatMap<Dest>(r => new Parser<Dest, Failure, Source>((source: Source) => {
      return this.run(source).map(fun)
    }))
  }

  flatMapError<E>(fun: (res: Failure) => Parser<Result, E, Source>): Parser<Result, E, Source> {
    return new Parser<Result, E, Source>((source: Source) => {
      return this.run(source).match<ParseResult<Result, E, Source>>({
        failure: (f: ParseFailure<Result, Failure, Source>) => fun(f.failure).run(source),
        success: (s: ParseSuccess<Result, Failure, Source>) => new ParseSuccess<Result, E, Source>(s.source, s.value)
      })
    })
  }
  
  mapError<OtherFailure>(fun: (e: Failure) => OtherFailure): Parser<Result, OtherFailure, Source> {
    return new Parser<Result, OtherFailure, Source>((source: Source) => {
      return this.run(source).match<ParseResult<Result, OtherFailure, Source>>({
        failure: (f: ParseFailure<Result, Failure, Source>) => new ParseFailure<Result, OtherFailure, Source>(f.source, fun(f.failure)),
        success: s => new ParseSuccess<Result, OtherFailure, Source>(s.source, s.value)
      })
    })
  }

  then<Dest>(next: Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source> {
    return this.flatMap(_ => next)
  }

  result<Dest>(value: Dest): Parser<Dest, Failure, Source> {
    return this.map(_ => value)
  }

  skip<Next>(next: Parser<Next, Failure, Source>): Parser<Result, Failure, Source> {
    return this.flatMap(r => next.result(r))
  }

  join<U extends any[]>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
      : Parser<[Result] | { [P in keyof U]: U[P] }, Failure, Source> {
    return this.flatMap((res: Result) => {
      console.log('XXX', res)
      return new Parser<[Result] | { [P in keyof U]: U[P] }, Failure, Source>(
        (source: Source) => {
          const buff: { [P in keyof U]: U[P] } = [] as never
          for (let i = 0; i < parsers.length; i++) {
            const parser = parsers[i]
            const result = parser.run(source)
            if (result.isFailure()) {
              return new ParseFailure(source, result.failure)
            } else {
              source = result.source
              buff[i] = result.value
            }
          }
          return new ParseSuccess(source, [res, ...buff] as never)
        }
      )
    })
  }

  or<U extends any[]>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
      : Parser<Result | TupleToUnion<U>, Failure, Source> {
    return this.flatMapError((f: Failure) => {
      return new Parser<Result | TupleToUnion<U>, Failure, Source>(
        (source: Source) => {
          for (let i = 0; i < parsers.length; i++) {
            const parser = parsers[i]
            const result = parser.run(source)
            if (result.kind === 'parse-failure') {
              f = result.failure
            } else {
              return result
            }
          }
          return new ParseFailure(source, f)
        }
      )
    })
  }
  
  many(atLeast = 1) {
    return new Parser<Result[], Failure, Source>((source: Source) => {
      const buff: Result[] = []
      while (true) {
        const result = this.run(source)
        if (result.kind === 'parse-success') {
          buff.push(result.value)
          source = result.source
        } else if (buff.length < atLeast) {
          return new ParseFailure(source, result.failure)
        } else {
          return new ParseSuccess<Result[], Failure, Source>(result.source, buff)
        }
      }
    })
  }

  between(min: number, max: number) {
    return new Parser<Result[], Failure, Source>((source: Source) => {
      const buff: Result[] = []
      for (let i = 0; i < max; i++) {
        const result = this.run(source)
        if (result.kind === 'parse-success') {
          buff.push(result.value)
          source = result.source
        } else if (buff.length < min) {
          return new ParseFailure(source, result.failure)
        } else {
          return new ParseSuccess<Result[], Failure, Source>(result.source, buff)
        }
      }
      return new ParseSuccess<Result[], Failure, Source>(source, buff)
    })
  }

  times(count: number) {
    return this.between(count, count)
  }

  atMost(times: number) {
    return this.between(0, times)
  }

  separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Result[], Failure, Source> {
    const pairs = separator.then(this).many()
    return this.flatMap<Result[]>((res: Result) => pairs.map(rs => [res].concat(rs)))
  }
  
  separatedBy<Separator>(separator: Parser<Separator, Failure, Source>) {
    return this.separatedByAtLeastOnce(separator).or(succeed([]))
  }

  probe(f: (v: ParseResult<Result, Failure, Source>) => void)
      : Parser<Result, Failure, Source> {
    return new Parser((source: Source) => {
      const result = this.run(source)
      f(result)
      return result
    })
  }

  // log() {
  //   return this.probe(v => console.log(String(v)))
  // }
}

export const seq = <U extends any[], Source, Failure>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
    : Parser<{ [P in keyof U]: U[P] }, Failure, Source> => {
  return new Parser<{ [P in keyof U]: U[P] }, Failure, Source>(
    (source: Source) => {
      const buff: { [P in keyof U]: U[P] } = [] as never
      for (let i = 0; i < parsers.length; i++) {
        const parser = parsers[i]
        const result = parser.run(source)
        if (result.kind === 'parse-failure') {
          return new ParseFailure(source, result.failure)
        } else {
          source = result.source
          buff[i] = result.value
        }
      }
      return new ParseSuccess(source, buff)
    }
  )
}

type TupleToUnion<T extends any[]> = T[number] | never

export const alt = <U extends any[], Source, Failure>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> }) => {
  if (parsers.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return new Parser<TupleToUnion<U>, Failure, Source>(
    (source: Source) => {
      let failure = undefined
      for (let i = 0; i < parsers.length; i++) {
        const parser = parsers[i]
        const result = parser.run(source)
        if (result.kind === 'parse-failure') {
          failure = result
        } else {
          return result
        }
      }
      return failure!
    }
  )
}

export const succeed = <Result, Failure, Source>(r: Result) =>
  new Parser<Result, Failure, Source>(source => new ParseSuccess(source, r))

export const fail = <Result, Failure, Source>(f: Failure) =>
  new Parser<Result, Failure, Source>(source => new ParseFailure(source, f))

export const many = <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, atLeast = 1) =>
  parser.many(atLeast)

export const between = <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, min: number, max: number) =>
  parser.between(min, max)

export const times = <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, count: number) =>
  parser.times(count)

export const atMost = <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, times: number) =>
  parser.atMost(times)

export const separatedByAtLeastOnce = <Result, Separator, Failure, Source>
    (parser: Parser<Result, Failure, Source>, separator: Parser<Separator, Failure, Source>) =>
  parser.separatedByAtLeastOnce(separator)

export const separatedBy = <Result, Separator, Failure, Source>
    (parser: Parser<Result, Failure, Source>, separator: Parser<Separator, Failure, Source>) =>
  parser.separatedBy(separator)

export const lazy = <Result, Failure, Source>(f: () => Parser<Result, Failure, Source>) => {
  let parser: Parser<Result, Failure, Source> | undefined
  return Parser.of((source: Source) => {
    if (parser === undefined)
      parser = f()
    return parser.run(source)
  })
}