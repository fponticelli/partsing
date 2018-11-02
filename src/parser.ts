import { ParseResult, ParseFailure, ParseSuccess } from './parse_result'
import { TupleToUnion } from './type_level'

export type Parsing<Out, Err, In> = (input: In) => ParseResult<Out, Err, In>

export class Parser<Out, Err, In> {
  static of<Out, Err, In>(run: (input: In) => ParseResult<Out, Err, In>) {
    return new Parser(run)
  }

  static ofGuaranteed<Out, Err, In>(run: (input: In) => [In, Out]) {
    return new Parser((input: In) =>
      ParseResult.success<Out, Err, In>(...run(input))
    )
  }

  constructor(readonly run: (input: In) => ParseResult<Out, Err, In>) {}

  flatMap<Out2>(fun: (res: Out) => Parser<Out2, Err, In>): Parser<Out2, Err, In> {
    return new Parser<Out2, Err, In>((input: In) => {
      const result = this.run(input)
      if (result.isSuccess()) {
        return fun(result.value).run(result.input)
      } else {
        return new ParseFailure(input, result.failure)
      }
    })
  }
  
  map<Dest>(fun: (res: Out) => Dest): Parser<Dest, Err, In> {
    return this.flatMap<Dest>(r => new Parser<Dest, Err, In>((input: In) =>
      new ParseSuccess(input, fun(r))
    ))
  }

  flatMapError<E>(fun: (res: Err) => Parser<Out, E, In>): Parser<Out, E, In> {
    return new Parser<Out, E, In>((input: In) =>
      this.run(input).match<ParseResult<Out, E, In>>({
        failure: (f: ParseFailure<Out, Err, In>) => fun(f.failure).run(input),
        success: (s: ParseSuccess<Out, Err, In>) => new ParseSuccess<Out, E, In>(s.input, s.value)
      })
    )
  }
  
  mapError<OtherFailure>(fun: (e: Err) => OtherFailure): Parser<Out, OtherFailure, In> {
    return new Parser<Out, OtherFailure, In>((input: In) =>
      this.run(input).match<ParseResult<Out, OtherFailure, In>>({
        failure: (f: ParseFailure<Out, Err, In>) => new ParseFailure<Out, OtherFailure, In>(f.input, fun(f.failure)),
        success: s => new ParseSuccess<Out, OtherFailure, In>(s.input, s.value)
      })
    )
  }

  pickNext<Dest>(next: Parser<Dest, Err, In>): Parser<Dest, Err, In> {
    return this.flatMap(_ => next)
  }

  skipNext<Next>(next: Parser<Next, Err, In>): Parser<Out, Err, In> {
    return this.flatMap((r: Out): Parser<Out, Err, In> => next.withResult(r))
  }

  join<Other>(other: Parser<Other, Err, In>)
      : Parser<[Out, Other], Err, In> {
    return this.flatMap((res: Out) =>
      other.map((o: Other): [Out, Other] => [res, o])
    )
  }

  or<U extends any[]>(...parsers: { [P in keyof U]: Parser<U[P], Err, In> })
      : Parser<Out | TupleToUnion<U>, Err, In> {
    return this.flatMapError((f: Err) =>
      new Parser<Out | TupleToUnion<U>, Err, In>(
        (input: In) => {
          for (let parser of parsers) {
            const result = parser.run(input)
            if (result.isFailure()) {
              f = result.failure
            } else {
              return result
            }
          }
          return new ParseFailure(input, f)
        }
      )
    )
  }
  
  repeatAtLeast(times = 1) {
    return new Parser<Out[], Err, In>((input: In) => {
      const buff: Out[] = []
      while (true) {
        const result = this.run(input)
        if (result.isSuccess()) {
          buff.push(result.value)
          input = result.input
        } else if (buff.length < times) {
          return new ParseFailure(input, result.failure)
        } else {
          return new ParseSuccess<Out[], Err, In>(input, buff)
        }
      }
    })
  }

  repeatBetween(min: number, max: number) {
    return new Parser<Out[], Err, In>((input: In) => {
      const buff: Out[] = []
      let failure = undefined
      for (let i = 0; i < max; i++) {
        const result = this.run(input)
        if (result.isSuccess()) {
          buff.push(result.value)
          input = result.input
        } else {
          failure = result.failure
          break
        }
      }
      if (buff.length < min) {
        return new ParseFailure(input, failure!)
      }
      return new ParseSuccess<Out[], Err, In>(input, buff)
    })
  }

  repeat(times: number) {
    return this.repeatBetween(times, times)
  }

  repeatAtMost(times: number) {
    return this.repeatBetween(0, times)
  }

  separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Err, In>): Parser<Out[], Err, In> {
    const pairs = separator.pickNext(this).repeatAtLeast(1)
    return this.flatMap<Out[]>((res: Out) => pairs.map(rs => [res].concat(rs)))
  }
  
  separatedBy<Separator>(separator: Parser<Separator, Err, In>)
      : Parser<Out[], Err, In> {
    return this.separatedByAtLeastOnce(separator)
      .or(this.map(v => [v]))
      .or(succeed([]))
  }

  test(predicate: (r: Out) => boolean, failure: Err): Parser<Out, Err, In> {
    return this.flatMap(res => new Parser<Out, Err, In>(input => {
      if (predicate(res)) {
        return ParseResult.success(input, res)
      } else {
        return ParseResult.failure(input, failure)
      }
    }))
  }

  probe(f: (v: ParseResult<Out, Err, In>) => void)
      : Parser<Out, Err, In> {
    return new Parser((input: In) => {
      const result = this.run(input)
      f(result)
      return result
    })
  }

  withResult<Dest>(value: Dest): Parser<Dest, Err, In> {
    return this.map(_ => value)
  }

  withFailure<E>(e: E): Parser<Out, E, In> {
    return this.mapError(_ => e)
  }
}

export const sequence = <U extends any[], Err, In>
    (...parsers: { [P in keyof U]: Parser<U[P], Err, In> })
    : Parser<{ [P in keyof U]: U[P] }, Err, In> => {
  return new Parser<{ [P in keyof U]: U[P] }, Err, In>(
    (input: In) => {
      const buff: { [P in keyof U]: U[P] } = [] as never
      for (let i = 0; i < parsers.length; i++) {
        const parser = parsers[i]
        const result = parser.run(input)
        if (result.isFailure()) {
          return new ParseFailure(input, result.failure)
        } else {
          input = result.input
          buff[i] = result.value
        }
      }
      return new ParseSuccess(input, buff)
    }
  )
}

export const oneOf = <U extends any[], Err, In>
    (...parsers: { [P in keyof U]: Parser<U[P], Err, In> }) => {
  if (parsers.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return new Parser<TupleToUnion<U>, Err, In>(
    (input: In) => {
      let failure = undefined
      for (let parser of parsers) {
        const result = parser.run(input)
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

export const succeed = <Out, Err, In>(r: Out) =>
  new Parser<Out, Err, In>(input => new ParseSuccess(input, r))

export const fail = <Out, Err, In>(f: Err) =>
  new Parser<Out, Err, In>(input => new ParseFailure(input, f))

export const lazy = <Out, Err, In>(f: () => Parser<Out, Err, In>) => {
  let parser: Parser<Out, Err, In> | undefined
  return Parser.of((input: In) => {
    if (parser === undefined)
      parser = f()
    return parser.run(input)
  })
}
