import { DecodeResult, DecodeFailure, DecodeSuccess } from './result'
import { TupleToUnion } from './type_level'

export type Decoding<In, Out, Err> = (input: In) => DecodeResult<In, Out, Err>

export class Decoder<In, Out, Err> {
  static of<In, Out, Err>(run: (input: In) => DecodeResult<In, Out, Err>) {
    return new Decoder(run)
  }

  static ofGuaranteed<In, Out, Err>(run: (input: In) => [In, Out]) {
    return new Decoder((input: In) =>
      DecodeResult.success<In, Out, Err>(...run(input))
    )
  }

  readonly _I!: In
  readonly _O!: Out
  readonly _E!: Err
  constructor(readonly run: (input: In) => DecodeResult<In, Out, Err>) {}

  flatMap<Out2>(fun: (res: Out) => Decoder<In, Out2, Err>): Decoder<In, Out2, Err> {
    return new Decoder<In, Out2, Err>((input: In) => {
      const result = this.run(input)
      if (result.isSuccess()) {
        return fun(result.value).run(result.input)
      } else {
        return new DecodeFailure(input, result.failure)
      }
    })
  }
  
  map<Out2>(fun: (res: Out) => Out2): Decoder<In, Out2, Err> {
    return this.flatMap<Out2>(r => new Decoder<In, Out2, Err>((input: In) =>
      new DecodeSuccess(input, fun(r))
    ))
  }

  sub<In2, Out2, Err2>(
    decoder: Decoder<In2, Out2, Err2>,
    mapInput: (o: Out) => In2,
    mapError: (e: Err2) => Err
  ): Decoder<In, Out2, Err> {
    return new Decoder<In, Out2, Err>((input: In): DecodeResult<In, Out2, Err> =>
      this.run(input).match<DecodeResult<In, Out2, Err>>({
        success: (s: DecodeSuccess<In, Out, Err>) =>
          decoder
            .mapError(mapError)
            .run(mapInput(s.value))
            .mapInput(_ => s.input),
        failure: (f: DecodeFailure<In, Out, Err>) => DecodeResult.failure(f.input, f.failure)
      })
    )
  }

  flatMapError<Err2>(fun: (res: Err) => Decoder<In, Out, Err2>): Decoder<In, Out, Err2> {
    return new Decoder<In, Out, Err2>((input: In) =>
      this.run(input).match<DecodeResult<In, Out, Err2>>({
        failure: (f: DecodeFailure<In, Out, Err>) => fun(f.failure).run(input),
        success: (s: DecodeSuccess<In, Out, Err>) => new DecodeSuccess<In, Out, Err2>(s.input, s.value)
      })
    )
  }
  
  mapError<Err2>(fun: (e: Err) => Err2): Decoder<In, Out, Err2> {
    return new Decoder<In, Out, Err2>((input: In) =>
      this.run(input).match<DecodeResult<In, Out, Err2>>({
        failure: (f: DecodeFailure<In, Out, Err>) => new DecodeFailure<In, Out, Err2>(f.input, fun(f.failure)),
        success: s => new DecodeSuccess<In, Out, Err2>(s.input, s.value)
      })
    )
  }

  pickNext<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, Out2, Err> {
    return this.flatMap(_ => next)
  }

  skipNext<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, Out, Err> {
    return this.flatMap((r: Out): Decoder<In, Out, Err> => next.withResult(r))
  }

  join<Out2>(other: Decoder<In, Out2, Err>)
      : Decoder<In, [Out, Out2], Err> {
    return this.flatMap((res: Out) =>
      other.map((o: Out2): [Out, Out2] => [res, o])
    )
  }

  or<U extends any[]>(...decoders: { [P in keyof U]: Decoder<In, U[P], Err> })
      : Decoder<In, Out | TupleToUnion<U>, Err> {
    return this.flatMapError((f: Err) =>
      new Decoder<In, Out | TupleToUnion<U>, Err>(
        (input: In) => {
          for (let decoder of decoders) {
            const result = decoder.run(input)
            if (result.isFailure()) {
              f = result.failure
            } else {
              return result
            }
          }
          return new DecodeFailure(input, f)
        }
      )
    )
  }
  
  repeatAtLeast(times = 1) {
    return new Decoder<In, Out[], Err>((input: In) => {
      const buff: Out[] = []
      while (true) {
        const result = this.run(input)
        if (result.isSuccess()) {
          buff.push(result.value)
          input = result.input
        } else if (buff.length < times) {
          return new DecodeFailure(input, result.failure)
        } else {
          return new DecodeSuccess<In, Out[], Err>(input, buff)
        }
      }
    })
  }

  repeatBetween(min: number, max: number) {
    return new Decoder<In, Out[], Err>((input: In) => {
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
        return new DecodeFailure(input, failure!)
      }
      return new DecodeSuccess<In, Out[], Err>(input, buff)
    })
  }

  repeat(times: number) {
    return this.repeatBetween(times, times)
  }

  repeatAtMost(times: number) {
    return this.repeatBetween(0, times)
  }

  separatedByAtLeastOnce<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    const pairs = separator.pickNext(this).repeatAtLeast(1)
    return this.flatMap<Out[]>((res: Out) => pairs.map(rs => [res].concat(rs)))
  }
  
  separatedBy<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    return this.separatedByAtLeastOnce(separator)
      .or(this.map(v => [v]))
      .or(succeed([]))
  }
  
  separatedByTimes<Separator>(separator: Decoder<In, Separator, Err>, times: number): Decoder<In, Out[], Err> {
    if (times <= 1)
      return this.map(v => [v])
    else {
      const pairs = separator.pickNext(this).repeat(times - 1)
      return this.flatMap<Out[]>((res: Out) => pairs.map(rs => [res].concat(rs)))
    }
  }

  test(predicate: (r: Out) => boolean, failure: Err): Decoder<In, Out, Err> {
    return this.flatMap(res => new Decoder<In, Out, Err>(input => {
      if (predicate(res)) {
        return DecodeResult.success(input, res)
      } else {
        return DecodeResult.failure(input, failure)
      }
    }))
  }

  probe(f: (v: DecodeResult<In, Out, Err>) => void): Decoder<In, Out, Err> {
    return new Decoder((input: In) => {
      const result = this.run(input)
      f(result)
      return result
    })
  }

  withResult<Out2>(value: Out2): Decoder<In, Out2, Err> {
    return this.map(_ => value)
  }

  withFailure<Err2>(e: Err2): Decoder<In, Out, Err2> {
    return this.mapError(_ => e)
  }
}

export const sequence = <In, U extends any[], Err>
    (...decoders: { [P in keyof U]: Decoder<In, U[P], Err> })
    : Decoder<In, { [P in keyof U]: U[P] }, Err> =>
  new Decoder<In, { [P in keyof U]: U[P] }, Err>(
    (input: In) => {
      const buff: { [P in keyof U]: U[P] } = [] as never
      for (let i = 0; i < decoders.length; i++) {
        const decoder = decoders[i]
        const result = decoder.run(input)
        if (result.isFailure()) {
          return new DecodeFailure(input, result.failure)
        } else {
          input = result.input
          buff[i] = result.value
        }
      }
      return new DecodeSuccess(input, buff)
    }
  )

export const oneOf = <In, U extends any[], Err>
    (...decoders: { [P in keyof U]: Decoder<In, U[P], Err> }) => {
  if (decoders.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return new Decoder<In, TupleToUnion<U>, Err>(
    (input: In) => {
      let failure = undefined
      for (let decoder of decoders) {
        const result = decoder.run(input)
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
  new Decoder<In, Out, Err>(input => new DecodeSuccess(input, r))

export const fail = <In, Out, Err>(f: Err) =>
  new Decoder<In, Out, Err>(input => new DecodeFailure(input, f))

export const lazy = <In, Out, Err>(f: () => Decoder<In, Out, Err>) => {
  let decoder: Decoder<In, Out, Err> | undefined
  return Decoder.of((input: In) => {
    if (decoder === undefined)
      decoder = f()
    return decoder.run(input)
  })
}
