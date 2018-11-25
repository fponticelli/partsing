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
import { TupleToUnion, Input, Error } from './type_level'

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

  /**
   * Construct an instance of `Decoder` using the passed `run` function to
   * perform the decoding.
   */
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
        return failure(input, ...result.failures)
      }
    })
  }

  /**
   * Convert and/or transform the result of a decoding into a different value.
   *
   * The applied function argument is executed exclusively on a succesful result
   * of decoding.
   *
   * *example*
   * ```ts
   * regexp(/\d{4}-\d{2}-\d{2}/y).map(Date.parse)
   * ```
   */
  map<Out2>(fun: (res: Out) => Out2): Decoder<In, Out2, Err> {
    return this.flatMap<Out2>(r => Decoder.of<In, Out2, Err>((input: In) => success(input, fun(r))))
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
          failure: (f: DecodeFailure<In, Out, Err>) => failure(f.input, ...f.failures)
        })
    )
  }

  /**
   * Like {@link flatMap} but for the failure case. It is also useful to recover
   * from an error.
   */
  flatMapError<Err2>(fun: (res: Err[]) => Decoder<In, Out, Err2>): Decoder<In, Out, Err2> {
    return Decoder.of<In, Out, Err2>((input: In) =>
      this.run(input).match<DecodeResult<In, Out, Err2>>({
        failure: (f: DecodeFailure<In, Out, Err>) => fun(f.failures).run(input),
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
        failure: (f: DecodeFailure<In, Out, Err>) => failure<In, Out, Err2>(f.input, ...f.failures.map(fun)),
        success: s => success<In, Out, Err2>(s.input, s.value)
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
   */
  or<U extends any[]>(
    ...decoders: { [P in keyof U]: Decoder<In, U[P], Err> }
  ): Decoder<In, Out | TupleToUnion<U>, Err> {
    return this.flatMapError((errs: Err[]) =>
      Decoder.of<In, Out | TupleToUnion<U>, Err>((input: In) => {
        for (let decoder of decoders) {
          const result = decoder.run(input)
          if (result.isFailure()) {
            errs = errs.concat(result.failures)
          } else {
            return result
          }
        }
        return failure(input, ...errs)
      })
    )
  }

  /**
   * Expect the current decoder to be repeated at least n `times`.
   *
   * The result is an array of `Out` values.
   */
  atLeast(times: number) {
    return Decoder.of<In, Out[], Err>((input: In) => {
      const buff: Out[] = []
      while (true) {
        const result = this.run(input)
        if (result.isSuccess()) {
          buff.push(result.value)
          input = result.input
        } else if (buff.length < times) {
          return failure(input, ...result.failures)
        } else {
          return success<In, Out[], Err>(input, buff)
        }
      }
    })
  }

  /**
   * Repeat the current decoder zero or more times.
   */
  many() {
    return this.atLeast(0)
  }

  /**
   * Repeat the current decoder between `min` and `max` times.
   */
  between(min: number, max: number) {
    return Decoder.of<In, Out[], Err>((input: In) => {
      const buff: Out[] = []
      let failures = undefined
      for (let i = 0; i < max; i++) {
        const result = this.run(input)
        if (result.isSuccess()) {
          buff.push(result.value)
          input = result.input
        } else {
          failures = result.failures
          break
        }
      }
      if (buff.length < min) {
        return failure(input, ...failures!)
      } else {
        return success<In, Out[], Err>(input, buff)
      }
    })
  }

  /**
   * Repeat the current decoder exactly n `times`.
   */
  repeat(times: number) {
    return this.between(times, times)
  }

  /**
   * Repeat the current decoder at most n `times`.
   *
   * Notice that this allows for zero successes. Which makes this decoder
   * optional.
   */
  atMost(times: number) {
    return this.between(0, times)
  }

  /**
   * Given a `separator` decoder, it returns an array of values from the current
   * decoder. It is expected that at least `times` values are returned from this
   * decoder.
   */
  atLeastWithSeparator<Separator>(times: number, separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    return this.betweenWithSeparator(times, Infinity, separator)
  }

  /**
   * Given a `separator` decoder, it returns an array of values from the current
   * decoder. It is expected that at most `times` values are returned from this
   * decoder.
   */
  atMostWithSeparator<Separator>(times: number, separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    return this.betweenWithSeparator(0, times, separator)
  }

  /**
   * Given a `separator` decoder, it returns an array of values from the current
   * decoder. It is expected any number of values returned, even zero.
   */
  manyWithSeparator<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    return this.atLeastWithSeparator(0, separator)
  }

  /**
   * Given a `separator` decoder, it returns an array of values from the current
   * decoder. It is expected that exactly `times` values are returned from this
   * decoder.
   */
  repeatWithSeparator<Separator>(times: number, separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err> {
    return this.betweenWithSeparator(times, times, separator)
  }

  /**
   * Given a `separator` decoder, it returns an array of values from the current
   * decoder. It is expected that between `min` and `max` values are returned.
   */
  betweenWithSeparator<Separator>(
    min: number,
    max: number,
    separator: Decoder<In, Separator, Err>
  ): Decoder<In, Out[], Err> {
    if (max < min) {
      const t = min
      min = max
      max = t
    }
    if (max <= 0) {
      return succeed([])
    }

    const pair = separator.pickNext(this)
    const decoderF = (value: Out) =>
      Decoder.of<In, Out[], Err>((input: In) => {
        const buff = [value]
        for (let i = 1; i < max; i++) {
          const res = pair.run(input)
          if (res.isFailure()) {
            if (i >= min) {
              return success(input, buff)
            } else {
              return failure(input, ...res.failures)
            }
          } else {
            buff.push(res.value)
            input = res.input
          }
        }
        return success(input, buff)
      })
    if (min <= 0) {
      return Decoder.of((input: In) => {
        const res = this.run(input)
        if (res.isSuccess()) {
          return decoderF(res.value).run(res.input)
        } else {
          return success<In, Out[], Err>(input, [])
        }
      })
    } else {
      return this.flatMap<Out[]>(decoderF)
    }
  }

  /**
   * Put the current decoder between `before` and `after`. The values captured
   * by `before` and `after` are discarded.
   *
   * @param before opening decoder.
   * @param after optional closing decoder. If omitted `before` will be used.
   */
  surroundedBy(before: Decoder<In, any, Err>, after?: Decoder<In, any, Err>): Decoder<In, Out, Err> {
    if (!after) after = before
    return before.pickNext(this).skipNext(after)
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
   *  *example*
   * ```ts
   * decoder.probe(console.log).map(v => ...)
   * ```
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
export const sequence = <
  U extends any[],
  D extends { [P in keyof U]: Decoder<Input<D[P]>, U[P], Error<D[P]>> } = {
    [P in keyof U]: Decoder<Input<D[P]>, U[P], Error<D[P]>>
  }
>(
  ...decoders: D & { [P in keyof U]: Decoder<Input<D[0]>, U[P], Error<D[0]>> }
) =>
  Decoder.of<Input<D[0]>, { [P in keyof U]: U[P] }, Error<D[0]>>((input: Input<D[0]>) => {
    const buff: { [P in keyof U]: U[P] } = [] as never
    for (let i = 0; i < decoders.length; i++) {
      const decoder = decoders[i]
      const result = decoder.run(input as never)
      if (result.isFailure()) {
        return failure(input, ...result.failures)
      } else {
        input = result.input
        buff[i] = result.value
      }
    }
    return success(input, buff)
  })

/**
 * Given an array of decoders, it traverses them all until one succeeds or they
 * all fail.
 */
export const oneOf = <
  U extends any[],
  D extends { [P in keyof U]: Decoder<Input<D[P]>, U[P], Error<D[P]>> } = {
    [P in keyof U]: Decoder<Input<D[P]>, U[P], Error<D[P]>>
  }
>(
  ...decoders: D & { [P in keyof U]: Decoder<Input<D[0]>, U[P], Error<D[0]>> }
) => {
  if (decoders.length === 0) throw new Error('alt needs to be called with at least one argumenr')
  return Decoder.of<Input<D[0]>, TupleToUnion<U>, Error<D[0]>>((input: Input<D[0]>) => {
    let failures: Error<D[0]>[] = []
    for (let decoder of decoders) {
      const result = decoder.run(input)
      if (result.isFailure()) {
        failures = failures.concat(result.failures)
      } else {
        return result
      }
    }
    return failure(input, ...failures)
  })
}

/**
 * Returns a decoder that always succeeds with the given result. The decoder
 * doesn't consume anything from the input.
 */
export const succeed = <In, Out, Err>(result: Out) => Decoder.of<In, Out, Err>(input => success(input, result))

/**
 * Returns a decoder that always fails with the given error.
 */
export const fail = <In, Out, Err>(err: Err) =>
  Decoder.of<In, Out, Err>((input: In) => failure<In, Out, Err>(input, err))

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
