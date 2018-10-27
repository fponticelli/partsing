import { ParseResult, ParseFailure, ParseSuccess } from './parse_result'

export type Parsing<Success, Failure, Source> = (source: Source) => ParseResult<Success, Failure, Source>

export class Parser<Success, Failure, Source> {
  static of<Success, Failure, Source>(run: (source: Source) => ParseResult<Success, Failure, Source>) {
    return new Parser(run)
  }

  static ofGuaranteed<Success, Failure, Source>(run: (source: Source) => [Source, Success]) {
    return new Parser((source: Source) =>
      ParseResult.success<Success, Failure, Source>(...run(source))
    )
  }

  constructor(readonly run: (source: Source) => ParseResult<Success, Failure, Source>) {}

  flatMap<Dest>(fun: (res: Success) => Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source> {
    return new Parser<Dest, Failure, Source>((source: Source) => {
      const result = this.run(source)
      if (result.isSuccess()) {
        return fun(result.value).run(result.source)
      } else {
        return new ParseFailure(source, result.failure)
      }
    })
  }
  
  map<Dest>(fun: (res: Success) => Dest): Parser<Dest, Failure, Source> {
    return this.flatMap<Dest>(r => new Parser<Dest, Failure, Source>((source: Source) => {
      return new ParseSuccess(source, fun(r))
    }))
  }

  flatMapError<E>(fun: (res: Failure) => Parser<Success, E, Source>): Parser<Success, E, Source> {
    return new Parser<Success, E, Source>((source: Source) => {
      return this.run(source).match<ParseResult<Success, E, Source>>({
        failure: (f: ParseFailure<Success, Failure, Source>) => fun(f.failure).run(source),
        success: (s: ParseSuccess<Success, Failure, Source>) => new ParseSuccess<Success, E, Source>(s.source, s.value)
      })
    })
  }
  
  mapError<OtherFailure>(fun: (e: Failure) => OtherFailure): Parser<Success, OtherFailure, Source> {
    return new Parser<Success, OtherFailure, Source>((source: Source) => {
      return this.run(source).match<ParseResult<Success, OtherFailure, Source>>({
        failure: (f: ParseFailure<Success, Failure, Source>) => new ParseFailure<Success, OtherFailure, Source>(f.source, fun(f.failure)),
        success: s => new ParseSuccess<Success, OtherFailure, Source>(s.source, s.value)
      })
    })
  }

  pickNext<Dest>(next: Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source> {
    return this.flatMap(_ => next)
  }

  skipNext<Next>(next: Parser<Next, Failure, Source>): Parser<Success, Failure, Source> {
    return this.flatMap((r: Success): Parser<Success, Failure, Source> => next.withResult(r))
  }

  join<Other>(other: Parser<Other, Failure, Source>)
      : Parser<[Success, Other], Failure, Source> {
    return this.flatMap((res: Success) => {
      return other.map((o: Other): [Success, Other] => [res, o])
    })
  }

  or<U extends any[]>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
      : Parser<Success | TupleToUnion<U>, Failure, Source> {
    return this.flatMapError((f: Failure) => {
      return new Parser<Success | TupleToUnion<U>, Failure, Source>(
        (source: Source) => {
          for (let i = 0; i < parsers.length; i++) {
            const parser = parsers[i]
            const result = parser.run(source)
            if (result.isFailure()) {
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
  
  repeatAtLeast(times = 1) {
    return new Parser<Success[], Failure, Source>((source: Source) => {
      const buff: Success[] = []
      while (true) {
        const result = this.run(source)
        if (result.isSuccess()) {
          buff.push(result.value)
          source = result.source
        } else if (buff.length < times) {
          return new ParseFailure(source, result.failure)
        } else {
          return new ParseSuccess<Success[], Failure, Source>(source, buff)
        }
      }
    })
  }

  repeatBetween(min: number, max: number) {
    return new Parser<Success[], Failure, Source>((source: Source) => {
      const buff: Success[] = []
      let failure = undefined
      for (let i = 0; i < max; i++) {
        const result = this.run(source)
        if (result.isSuccess()) {
          buff.push(result.value)
          source = result.source
        } else {
          failure = result.failure
          break
        }
      }
      if (buff.length < min) {
        return new ParseFailure(source, failure!)
      }
      return new ParseSuccess<Success[], Failure, Source>(source, buff)
    })
  }

  repeat(times: number) {
    return this.repeatBetween(times, times)
  }

  repeatAtMost(times: number) {
    return this.repeatBetween(0, times)
  }

  separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Success[], Failure, Source> {
    const pairs = separator.pickNext(this).repeatAtLeast(1)
    return this.flatMap<Success[]>((res: Success) => pairs.map(rs => [res].concat(rs)))
  }
  
  separatedBy<Separator>(separator: Parser<Separator, Failure, Source>)
      : Parser<Success[], Failure, Source> {
    return this.separatedByAtLeastOnce(separator)
      .or(this.map(v => [v]))
      .or(succeed([]))
  }

  probe(f: (v: ParseResult<Success, Failure, Source>) => void)
      : Parser<Success, Failure, Source> {
    return new Parser((source: Source) => {
      const result = this.run(source)
      f(result)
      return result
    })
  }

  withResult<Dest>(value: Dest): Parser<Dest, Failure, Source> {
    return this.map(_ => value)
  }

  withFailure<E>(e: E): Parser<Success, E, Source> {
    return this.mapError(_ => e)
  }
}

export const sequence = <U extends any[], Failure, Source>
    (...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
    : Parser<{ [P in keyof U]: U[P] }, Failure, Source> => {
  return new Parser<{ [P in keyof U]: U[P] }, Failure, Source>(
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
      return new ParseSuccess(source, buff)
    }
  )
}

type TupleToUnion<T extends any[]> = T[number] | never

export const oneOf = <U extends any[], Failure, Source>
    (...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> }) => {
  if (parsers.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return new Parser<TupleToUnion<U>, Failure, Source>(
    (source: Source) => {
      let failure = undefined
      for (let i = 0; i < parsers.length; i++) {
        const parser = parsers[i]
        const result = parser.run(source)
        if (result.isFailure()) {
          failure = result
        } else {
          return result
        }
      }
      return failure!
    }
  )
}

export const succeed = <Success, Failure, Source>(r: Success) =>
  new Parser<Success, Failure, Source>(source => new ParseSuccess(source, r))

export const fail = <Success, Failure, Source>(f: Failure) =>
  new Parser<Success, Failure, Source>(source => new ParseFailure(source, f))

export const lazy = <Success, Failure, Source>(f: () => Parser<Success, Failure, Source>) => {
  let parser: Parser<Success, Failure, Source> | undefined
  return Parser.of((source: Source) => {
    if (parser === undefined)
      parser = f()
    return parser.run(source)
  })
}