/*
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { DecodeFailure, DecodeResult, DecodeSuccess, failure, success } from './result'
import { TupleToUnion } from './type_level'

/**
 * Type signature for a function that takes an input and decodes it into a
 * result object.
 */
export type Decoding<In, Out, Err> = (input: In) => DecodeResult<In, Out, Err>

/**
 * The Decoder class is the base type to implement custom decoders.
 * It has three type parameters:
 *
 * * `In` for input. The input to a decoder can be any raw value that your decoder
 * can extract information from. In a simple case it could be a `string` value
 * or an array of bytes. If decoders are chained, the input needs to be
 * transferred from one decoder to the following one. That is why
 * {@link DecodeResult} has an `Input` as well. It is important to notice that
 * what is passed to the next decoder needs to be the relative input and not the
 * original one. For efficiency reasons, most decoders will wrap their own input
 * into some more sophisticated type to allow tracking the current position in
 * the stream.
 *
 * * `Out` for output. It's the type of the value return by the decoder if it
 * succeeds. Through operations like {@link Decoder.map} and
 * {@link Decoder.flatMap}, this type can be changed.
 *
 * * `Err` for error. It's the type of the error message. In some
 * implementations it might be as simple as `string`. For the embedded decoders
 * (text and value), the error is fixed to the
 * {@link DecodeError} unione type.
 * The constructors for {@link DecodeError} have more semantic value than
 * strings and can be properly used for localization.
 */
export class Decoder<In, Out, Err> {
  /**
   * Creates a decoder from a [Decoding] function.
   */
  static of<In, Out, Err>(run: Decoding<In, Out, Err>) {
    return new Decoder(run)
  }

  /**
   * These placeholder (`_I`, `_O`, `_E`) types are not expected to bring any
   * value. They exist to allow inspecting the main types of a Decoder at
   * compile time.
   */
  readonly _E!: Err
  /**
   * See {@link _E}.
   */
  readonly _I!: In
  /**
   * See {@link _E}.
   */
  readonly _O!: Out
  private constructor(readonly run: Decoding<In, Out, Err>) {}

  /**
   * `flatMap` allows to combine the result of a decoder with a new one.
   *
   * It can be used to conditionally pick the next decoder in a chain based
   * on the result of a previous step.
   */
  flatMap<Out2>(fun: (res: Out) => Decoder<In, Out2, Err>): Decoder<In, Out2, Err> {
    return Decoder.of<In, Out2, Err>((input: In) => {
      const result = this.run(input)
      if (result.isSuccess()) {
        return fun(result.value).run(result.input)
      } else {
        return new DecodeFailure(input, result.failure)
      }
    })
  }

  /**
   * Convert and/or transform the result of a decoding into a different value.
   *
   * The applied function argument is executed exclusively on a succesful result
   * of decoding.
   *
   * @example
   *
   * regexp(/\d{4}-\d{2}-\d{2}/y).map(Date.parse)
   */
  map<Out2>(fun: (res: Out) => Out2): Decoder<In, Out2, Err> {
    return this.flatMap<Out2>(r => Decoder.of<In, Out2, Err>((input: In) => new DecodeSuccess(input, fun(r))))
  }

  /**
   * Allow to convert the result of decoder into the input for another one. It
   * can be used to use different kind of decoders together.
   */
  sub<In2, Out2, Err2>(
    decoder: Decoder<In2, Out2, Err2>,
    mapInput: (o: Out) => In2,
    mapError: (e: Err2) => Err
  ): Decoder<In, Out2, Err> {
    return Decoder.of<In, Out2, Err>(
      (input: In): DecodeResult<In, Out2, Err> =>
        this.run(input).match<DecodeResult<In, Out2, Err>>({
          success: (s: DecodeSuccess<In, Out, Err>) =>
            decoder
              .mapError(mapError)
              .run(mapInput(s.value))
              .mapInput(_ => s.input),
          failure: (f: DecodeFailure<In, Out, Err>) => failure(f.input, f.failure)
        })
    )
  }

  /**
   * Like {@link flatMap} but for the failure case. It is also useful to recover
   * from an error.
   */
  flatMapError<Err2>(fun: (res: Err) => Decoder<In, Out, Err2>): Decoder<In, Out, Err2> {
    return Decoder.of<In, Out, Err2>((input: In) =>
      this.run(input).match<DecodeResult<In, Out, Err2>>({
        failure: (f: DecodeFailure<In, Out, Err>) => fun(f.failure).run(input),
        success: (s: DecodeSuccess<In, Out, Err>) => success<In, Out, Err2>(s.input, s.value)
      })
    )
  }

  /**
   * Like {@link map} but for the failure case.
   */
  mapError<Err2>(fun: (e: Err) => Err2): Decoder<In, Out, Err2> {
    return Decoder.of<In, Out, Err2>((input: In) =>
      this.run(input).match<DecodeResult<In, Out, Err2>>({
        failure: (f: DecodeFailure<In, Out, Err>) => new DecodeFailure<In, Out, Err2>(f.input, fun(f.failure)),
        success: s => new DecodeSuccess<In, Out, Err2>(s.input, s.value)
      })
    )
  }

  /**
   * On a successful decoding of the current decoder, it moves to the `next` one
   * returning only its result.
   */
  pickNext<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, Out2, Err> {
    return this.flatMap(_ => next)
  }

  /**
   * Make sure that the current decoder is followed by the one defined in `next`
   * but it ignores its result.
   */
  skipNext<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, Out, Err> {
    return this.flatMap((r: Out): Decoder<In, Out, Err> => next.withResult(r))
  }

  /**
   * Combines the result of the current decoder with the one in next and returns
   * them as tuple of two if they are both successful.
   */
  join<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, [Out, Out2], Err> {
    return this.flatMap((res: Out) => next.map((o: Out2): [Out, Out2] => [res, o]))
  }

  /**
   * If the current decoder fails, it tries the ones passed as arguments until
   * one of them succeeds or they all fail.
   *
   * The first argument `combineErrors` is optional (if omitted `undefined`
   * needs to be passed). The provided function is used to combine an array of
   * `Err` into one. If you are using {@link DecodeError} you can pass
   * {@link DecodeError.combine}.
   * If not passed, the failure will report the failure of the current decoder.
   */
  or<U extends any[]>(
    combineErrors: undefined | ((errs: Err[]) => Err),
    ...decoders: { [P in keyof U]: Decoder<In, U[P], Err> }
  ): Decoder<In, Out | TupleToUnion<U>, Err> {
    return this.flatMapError((f: Err) =>
      Decoder.of<In, Out | TupleToUnion<U>, Err>((input: In) => {
        const failures = []
        for (let decoder of decoders) {
          const result = decoder.run(input)
          if (result.isFailure()) {
            failures.push(result.failure)
          } else {
            return result
          }
        }
        if (combineErrors) {
          return new DecodeFailure(input, combineErrors(failures))
        } else {
          return new DecodeFailure(input, f)
        }
      })
    )
  }

  /**
   * Expect the current decoder to be repeated at least n `times`.
   *
   * The result is an array of `Out` values.
   */
  repeatAtLeast(times = 1) {
    return Decoder.of<In, Out[], Err>((input: In) => {
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

  /**
   * Repeat the current decoder between `min` and `max` times.
   */
  repeatBetween(min: number, max: number) {
    return Decoder.of<In, Out[], Err>((input: In) => {
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

  /**
   * Repeat the current decoder exactly n `times`.
   */
  repeat(times: number) {
    return this.repeatBetween(times, times)
  }

  /**
   * Repeat the current decoder at most n `times`.
   *
   * Notice that this allows for zero successes. Which makes this decoder
   * optional.
   */
  repeatAtMost(times: number) {
    return this.repeatBetween(0, times)
  }

  /**
   * Given a `separator` decoder, it returns an array of values from the current
   * decoder. It is expected that at least two values are returned from this
   * decoder.
   */
  separatedByAtLeastOnce<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    const pairs = separator.pickNext(this).repeatAtLeast(1)
    return this.flatMap<Out[]>((res: Out) => pairs.map(rs => [res].concat(rs)))
  }

  /**
   * Like {@link separatedByAtLeastOnce} but without the expectation that at
   * least two values are captured.
   */
  separatedBy<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    return this.separatedByAtLeastOnce(separator)
      .or(undefined, this.map(v => [v]))
      .or(undefined, succeed([]))
  }

  /**
   * Like [separatedByAtLeastOne] but expecting a fixed number of results.
   */
  separatedByTimes<Separator>(separator: Decoder<In, Separator, Err>, times: number): Decoder<In, Out[], Err> {
    if (times <= 1) return this.map(v => [v])
    else {
      const pairs = separator.pickNext(this).repeat(times - 1)
      return this.flatMap<Out[]>((res: Out) => pairs.map(rs => [res].concat(rs)))
    }
  }

  /**
   * If the current decoder is successful it passes its value to `predicate`
   * and succeed the decoding if the function returns `true`.
   *
   * `failure` is provided to have an explicit error if `predicate` fails.
   */
  test(predicate: (r: Out) => boolean, err: Err): Decoder<In, Out, Err> {
    return this.flatMap(res =>
      Decoder.of<In, Out, Err>(input => {
        if (predicate(res)) {
          return success(input, res)
        } else {
          return failure(input, err)
        }
      })
    )
  }

  /**
   * The `probe` method is used to perform a side-effecty function somewhere in
   * the decoder chain. It is mostly used as a debugging mechanism.
   *
   * @example
   *
   * decoder.probe(console.log).map(v -> ...)
   *
   */
  probe(f: (v: DecodeResult<In, Out, Err>) => void): Decoder<In, Out, Err> {
    return Decoder.of((input: In) => {
      const result = this.run(input)
      f(result)
      return result
    })
  }

  /**
   * If the current decoder executes succesfully, ignore its result and
   * replace it with `value`.
   */
  withResult<Out2>(value: Out2): Decoder<In, Out2, Err> {
    return this.map(_ => value)
  }

  /**
   * If the current decoder fails, replace its error with the value of `e`.
   */
  withFailure<Err2>(e: Err2): Decoder<In, Out, Err2> {
    return this.mapError(_ => e)
  }
}

/**
 * Given an array of decoders it tries to apply them all in sequence.
 * If they all succeed it returns a typed `n` tuple where each element type
 * matches the expected type of the corresponding decoder.
 */
export const sequence = <In, U extends any[], Err>(
  ...decoders: { [P in keyof U]: Decoder<In, U[P], Err> }
): Decoder<In, { [P in keyof U]: U[P] }, Err> =>
  Decoder.of<In, { [P in keyof U]: U[P] }, Err>((input: In) => {
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
  })

/**
 * Given an array of decoders, it traverses them all until one succeeds or they
 * all fail.
 *
 * `combineErrors` works the same as in {@link or}.
 */
export const oneOf = <In, U extends any[], Err>(
  combineErrors: undefined | ((errs: Err[]) => Err),
  ...decoders: { [P in keyof U]: Decoder<In, U[P], Err> }
) => {
  if (decoders.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return Decoder.of<In, TupleToUnion<U>, Err>((input: In) => {
    const failures = []
    for (let decoder of decoders) {
      const result = decoder.run(input)
      if (result.isFailure()) {
        failures.push(result.failure)
      } else {
        return result
      }
    }
    if (combineErrors) {
      return failure(input, combineErrors(failures))
    } else {
      return failure(input, failures[0])
    }
  })
}

/**
 * Returns a decoder that always succeeds with the given result. The decoder
 * doesn't consume anything from the input.
 */
export const succeed = <In, Out, Err>(result: Out) =>
  Decoder.of<In, Out, Err>(input => new DecodeSuccess(input, result))

/**
 * Returns a decoder that always fails with the given error.
 */
export const fail = <In, Out, Err>(failure: Err) => Decoder.of<In, Out, Err>(input => new DecodeFailure(input, failure))

/**
 * Often time decoders are defined recursively. The language and type-system
 * do not allow for recursion. To work around that limit you create a `lazy`
 * decoder that wraps the desired decoder into a lazy function.
 *
 * The decoder function `f` is only invoked once and its result is reused
 * mutliple times if needed.
 */
export const lazy = <In, Out, Err>(f: () => Decoder<In, Out, Err>) => {
  let decoder: Decoder<In, Out, Err> | undefined
  return Decoder.of((input: In) => {
    if (decoder === undefined) decoder = f()
    return decoder.run(input)
  })
}
