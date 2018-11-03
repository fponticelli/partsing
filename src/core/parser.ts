import { ParseResult, ParseFailure, ParseSuccess } from './result'
import { TupleToUnion } from './type_level'

export type Parsing<In, Out, Err> = (input: In) => ParseResult<In, Out, Err>

export class Parser<In, Out, Err> {
  static of<In, Out, Err>(run: (input: In) => ParseResult<In, Out, Err>) {
    return new Parser(run)
  }

  static ofGuaranteed<In, Out, Err>(run: (input: In) => [In, Out]) {
    return new Parser((input: In) =>
      ParseResult.success<In, Out, Err>(...run(input))
    )
  }

  constructor(readonly run: (input: In) => ParseResult<In, Out, Err>) {}

  flatMap<Out2>(fun: (res: Out) => Parser<In, Out2, Err>): Parser<In, Out2, Err> {
    return new Parser<In, Out2, Err>((input: In) => {
      const result = this.run(input)
      if (result.isSuccess()) {
        return fun(result.value).run(result.input)
      } else {
        return new ParseFailure(input, result.failure)
      }
    })
  }
  
  map<Out2>(fun: (res: Out) => Out2): Parser<In, Out2, Err> {
    return this.flatMap<Out2>(r => new Parser<In, Out2, Err>((input: In) =>
      new ParseSuccess(input, fun(r))
    ))
  }

  flatMapError<Err2>(fun: (res: Err) => Parser<In, Out, Err2>): Parser<In, Out, Err2> {
    return new Parser<In, Out, Err2>((input: In) =>
      this.run(input).match<ParseResult<In, Out, Err2>>({
        failure: (f: ParseFailure<In, Out, Err>) => fun(f.failure).run(input),
        success: (s: ParseSuccess<In, Out, Err>) => new ParseSuccess<In, Out, Err2>(s.input, s.value)
      })
    )
  }
  
  mapError<Err2>(fun: (e: Err) => Err2): Parser<In, Out, Err2> {
    return new Parser<In, Out, Err2>((input: In) =>
      this.run(input).match<ParseResult<In, Out, Err2>>({
        failure: (f: ParseFailure<In, Out, Err>) => new ParseFailure<In, Out, Err2>(f.input, fun(f.failure)),
        success: s => new ParseSuccess<In, Out, Err2>(s.input, s.value)
      })
    )
  }

  pickNext<Out2>(next: Parser<In, Out2, Err>): Parser<In, Out2, Err> {
    return this.flatMap(_ => next)
  }

  skipNext<Out2>(next: Parser<In, Out2, Err>): Parser<In, Out, Err> {
    return this.flatMap((r: Out): Parser<In, Out, Err> => next.withResult(r))
  }

  join<Out2>(other: Parser<In, Out2, Err>)
      : Parser<In, [Out, Out2], Err> {
    return this.flatMap((res: Out) =>
      other.map((o: Out2): [Out, Out2] => [res, o])
    )
  }

  or<U extends any[]>(...parsers: { [P in keyof U]: Parser<In, U[P], Err> })
      : Parser<In, Out | TupleToUnion<U>, Err> {
    return this.flatMapError((f: Err) =>
      new Parser<In, Out | TupleToUnion<U>, Err>(
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
    return new Parser<In, Out[], Err>((input: In) => {
      const buff: Out[] = []
      while (true) {
        const result = this.run(input)
        if (result.isSuccess()) {
          buff.push(result.value)
          input = result.input
        } else if (buff.length < times) {
          return new ParseFailure(input, result.failure)
        } else {
          return new ParseSuccess<In, Out[], Err>(input, buff)
        }
      }
    })
  }

  repeatBetween(min: number, max: number) {
    return new Parser<In, Out[], Err>((input: In) => {
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
      return new ParseSuccess<In, Out[], Err>(input, buff)
    })
  }

  repeat(times: number) {
    return this.repeatBetween(times, times)
  }

  repeatAtMost(times: number) {
    return this.repeatBetween(0, times)
  }

  separatedByAtLeastOnce<Separator>(separator: Parser<In, Separator, Err>): Parser<In, Out[], Err> {
    const pairs = separator.pickNext(this).repeatAtLeast(1)
    return this.flatMap<Out[]>((res: Out) => pairs.map(rs => [res].concat(rs)))
  }
  
  separatedBy<Separator>(separator: Parser<In, Separator, Err>)
      : Parser<In, Out[], Err> {
    return this.separatedByAtLeastOnce(separator)
      .or(this.map(v => [v]))
      .or(succeed([]))
  }

  test(predicate: (r: Out) => boolean, failure: Err): Parser<In, Out, Err> {
    return this.flatMap(res => new Parser<In, Out, Err>(input => {
      if (predicate(res)) {
        return ParseResult.success(input, res)
      } else {
        return ParseResult.failure(input, failure)
      }
    }))
  }

  probe(f: (v: ParseResult<In, Out, Err>) => void)
      : Parser<In, Out, Err> {
    return new Parser((input: In) => {
      const result = this.run(input)
      f(result)
      return result
    })
  }

  withResult<Out2>(value: Out2): Parser<In, Out2, Err> {
    return this.map(_ => value)
  }

  withFailure<Err2>(e: Err2): Parser<In, Out, Err2> {
    return this.mapError(_ => e)
  }
}

export const sequence = <In, U extends any[], Err>
    (...parsers: { [P in keyof U]: Parser<In, U[P], Err> })
    : Parser<In, { [P in keyof U]: U[P] }, Err> => {
  return new Parser<In, { [P in keyof U]: U[P] }, Err>(
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

export const oneOf = <In, U extends any[], Err>
    (...parsers: { [P in keyof U]: Parser<In, U[P], Err> }) => {
  if (parsers.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return new Parser<In, TupleToUnion<U>, Err>(
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

export const succeed = <In, Out, Err>(r: Out) =>
  new Parser<In, Out, Err>(input => new ParseSuccess(input, r))

export const fail = <In, Out, Err>(f: Err) =>
  new Parser<In, Out, Err>(input => new ParseFailure(input, f))

export const lazy = <In, Out, Err>(f: () => Parser<In, Out, Err>) => {
  let parser: Parser<In, Out, Err> | undefined
  return Parser.of((input: In) => {
    if (parser === undefined)
      parser = f()
    return parser.run(input)
  })
}
