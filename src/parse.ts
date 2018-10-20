import { match } from './parse_text'

abstract class ParseResultBase<Result, Failure, Source> {
  constructor(
    readonly source: Source | undefined
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<Result, Failure, Source>) => O,
    failure: (f: ParseFailure<Result, Failure, Source>) => O
  }): O
    
  abstract flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>
  abstract flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source>
  
  abstract map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source>
  abstract mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source>

  abstract toString(): string;
}

export class ParseSuccess<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
  readonly kind = 'parse-success'
  constructor(
    source: Source | undefined,
    readonly value: Result
  ) {
    super(source)
  }

  match<O>(o: {
    success: (s: ParseSuccess<Result, Failure, Source>) => O,
    failure: (f: ParseFailure<Result, Failure, Source>) => O
  }): O {
    return o.success(this)
  }

  flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source> {
    return f(this.value)
  }
  map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source> {
    return this.flatMap(v => new ParseSuccess(this.source, f(v)))
  }
  flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source> {
    return new ParseSuccess(this.source, this.value)
  }
  mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source> {
    return new ParseSuccess(this.source, this.value)
  }
  toString(): string {
    return `ParseSuccess<${JSON.stringify(this.value)}>: ${JSON.stringify(this.source)}`
  }
}

export class ParseFailure<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
  readonly kind = 'parse-failure'
  constructor(
    source: Source | undefined,
    readonly failure: Failure
  ) {
    super(source)
  }

  match<O>(o: {
    success: (succ: ParseSuccess<Result, Failure, Source>) => O,
    failure: (fail: ParseFailure<Result, Failure, Source>) => O
  }): O {
    return o.failure(this)
  }

  flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source> {
    return new ParseFailure(this.source, this.failure)
  }
  map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source> {
    return new ParseFailure(this.source, this.failure)
  }
  flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source> {
    return f(this.failure)
  }
  mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source> {
    return this.flatMapError(e => new ParseFailure(this.source, f(e)))
  }
  toString(): string {
    return `ParseFailure<${JSON.stringify(this.failure)}>: ${JSON.stringify(this.source)}`
  }
}

export type ParseResult<Result, Failure, Source> = ParseSuccess<Result, Failure, Source> | ParseFailure<Result, Failure, Source>

export type Parsing<Result, Failure, Source> = (source: Source) => ParseResult<Result, Failure, Source>

export class Parser<Result, Failure, Source> {
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

  seq<U extends any[]>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
      : Parser<[Result] | { [P in keyof U]: U[P] }, Failure, Source> {
    return this.flatMap((res: Result) => {
      return new Parser<[Result] | { [P in keyof U]: U[P] }, Failure, Source>(
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
          return new ParseSuccess(source, [res, ...buff] as never)
        }
      )
    })
  }

  alt<U extends any[]>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source> })
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

  probe(f: (v: ParseResult<Result, Failure, Source>) => void)
      : Parser<Result, Failure, Source> {
    return new Parser((source: Source) => {
      const result = this.run(source)
      f(result)
      return result
    })
  }

  log() {
    return this.probe(v => console.log(String(v)))
  }
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
      let failure
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