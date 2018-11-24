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

/**
 * {@link DecodeResult} is a union type that has two possible constructors
 * {@link DecodeSuccess} and {@link DecodeFailure}.
 *
 * `DecodeResultBase` is abstract and should never be used directly. It is
 * defined to provide a common signature to the only two possible constructors
 * {@link DecodeSuccess} and {@link DecodeFailure}.
 *
 * See `{@link DecodeResult}`.
 *
 */
abstract class DecodeResultBase<In, Out, Err> {
  /**
   * These placeholder (`_I`, `_O`, `_E`) types are not expected to bring any
   * value. They exist to allow inspecting the main types of a DecodeResult at
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
   * Type discriminator
   */
  abstract readonly kind: 'decode-success' | 'decode-failure'

  /**
   * Construct an instance of `{@link DecodeResult}`. The only field that is shared
   * between `{@link DecodeSuccess}` and `{@link DecodeFailure}` is `input: In`.
   */
  constructor(readonly input: In) {}

  /**
   * Transform an instance of `{@link DecodeResult}` into any type `O`.
   * To perform the transformation an object is passed with 2 fields `success`
   * and `failure`. Both fields must be populated with a function.
   *
   * * `success` will take a function `DecodeSuccess -> O`
   * * `failure` will take a function `DecodeFailure -> O`
   */
  abstract match<O>(o: {
    success: (s: DecodeSuccess<In, Out, Err>) => O
    failure: (f: DecodeFailure<In, Out, Err>) => O
  }): O

  /**
   * Transfom the result of a `DecodeSuccess` into a new `DecodeResult` by applying
   * the function `f` to it.
   */
  abstract flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err>
  /**
   * Transfom the result of a `DecodeFailure` into a new `DecodeResult` by applying
   * the function `f` to it. This operation allows to recover form a failed result.
   */
  abstract flatMapError<Err2>(f: (r: Err[]) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2>

  /**
   * Transfom the result of a `DecodeSuccess` into a new value of type `Out2` by
   * applying the function `f` to the original `Out` value.
   */
  abstract map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err>

  /**
   * Transfom the result of a `DecodeFailure` into a new value of type `Err2` by
   * applying the function `f` to the original `Err` value.
   */
  abstract mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2>

  /**
   * Transform the input value associated with the current `DecodeResult` into
   * a new input of type `In2`.
   */
  abstract mapInput<In2>(f: (i: In) => In2): DecodeResult<In2, Out, Err>

  /**
   * Return true if the current instance is of type `DecodeSuccess`. It also
   * provide a guard value so that properties of `DecodeSuccess` can be used
   * in the right conditional scope.
   */
  abstract isSuccess(): this is DecodeSuccess<In, Out, Err>

  /**
   * Return true if the current instance is of type `DecodeFailure`. It also
   * provide a guard value so that properties of `DecodeFailure` can be used
   * in the right conditional scope.
   */
  abstract isFailure(): this is DecodeFailure<In, Out, Err>

  /**
   * Unwrap the result value of a `DecodeSuccess`. If the current instance is of
   * type `DecodeFailure` then this function will throw an exception.
   * Do not use unless you are protecting from exceptions.
   */
  abstract getUnsafeSuccess(): Out

  /**
   * Unwrap the result value of a `DecodeFailure`. If the current instance is of
   * type `DecodeSuccess` then this function will throw an exception.
   * Do not use unless you are protecting from exceptions.
   */
  abstract getUnsafeFailures(): Err[]

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  abstract toString(): string
}

export class DecodeSuccess<In, Out, Err> extends DecodeResultBase<In, Out, Err> {
  /**
   * Type discriminator
   */
  readonly kind = 'decode-success'

  /**
   * Contruct an instance of `DecodeSuccess`.
   * @param input The input value that the next decoder should try to consume.
   * @param value The value generated from the decoding operation.
   */
  constructor(input: In, readonly value: Out) {
    super(input)
  }

  /**
   * See {@link DecodeResultBase.match}
   */
  match<O>(o: { success: (s: DecodeSuccess<In, Out, Err>) => O; failure: (f: DecodeFailure<In, Out, Err>) => O }): O {
    return o.success(this)
  }

  /**
   * See {@link DecodeResultBase.flatMap}
   */
  flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err> {
    return f(this.value)
  }

  /**
   * See {@link DecodeResultBase.map}
   */
  map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err> {
    return this.flatMap(v => new DecodeSuccess(this.input, f(v)))
  }

  /**
   * See {@link DecodeResultBase.flatMapError}
   */
  flatMapError<Err2>(f: (r: Err[]) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2> {
    return new DecodeSuccess(this.input, this.value)
  }

  /**
   * See {@link DecodeResultBase.mapError}
   */
  mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2> {
    return new DecodeSuccess(this.input, this.value)
  }

  /**
   * See {@link DecodeResultBase.mapInput}
   */
  mapInput<In2>(f: (i: In) => In2): DecodeResult<In2, Out, Err> {
    return new DecodeSuccess(f(this.input), this.value)
  }

  /**
   * See {@link DecodeResultBase.isSuccess}
   */
  isSuccess(): this is DecodeSuccess<In, Out, Err> {
    return true
  }

  /**
   * See {@link DecodeResultBase.isFailure}
   */
  isFailure(): this is DecodeFailure<In, Out, Err> {
    return false
  }

  /**
   * See {@link DecodeResultBase.getUnsafeSuccess}
   */
  getUnsafeSuccess(): Out {
    return this.value
  }

  /**
   * See {@link DecodeResultBase.getUnsafeFailures}
   */
  getUnsafeFailures(): Err[] {
    throw new Error("can't get failure from success")
  }

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString(): string {
    return `DecodeSuccess<${JSON.stringify(this.value)}>: ${JSON.stringify(this.input)}`
  }
}

export class DecodeFailure<In, Out, Err> extends DecodeResultBase<In, Out, Err> {
  /**
   * Type discriminator
   */
  readonly kind = 'decode-failure'

  /**
   * Contains all the possible reasons of why a decoder failed.
   */
  readonly failures: Err[]

  /**
   * Contruct an instance of `DecodeFailure`.
   * @param input The input value that corresponds to the place where the decoder
   * failed to generate a valid result.
   * @param failures The error messages associated with the reason why the decoder
   * failed.
   */
  constructor(input: In, ...failures: Err[]) {
    super(input)
    this.failures = failures
  }

  /**
   * See {@link DecodeResultBase.match}
   */
  match<O>(o: {
    success: (succ: DecodeSuccess<In, Out, Err>) => O
    failure: (fail: DecodeFailure<In, Out, Err>) => O
  }): O {
    return o.failure(this)
  }

  /**
   * See {@link DecodeResultBase.flatMap}
   */
  flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err> {
    return new DecodeFailure(this.input, ...this.failures)
  }

  /**
   * See {@link DecodeResultBase.map}
   */
  map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err> {
    return new DecodeFailure(this.input, ...this.failures)
  }

  /**
   * See {@link DecodeResultBase.flatMapError}
   */
  flatMapError<Err2>(f: (r: Err[]) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2> {
    return f(this.failures)
  }

  /**
   * See {@link DecodeResultBase.mapError}
   */
  mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2> {
    return failure(this.input, ...this.failures.map(f))
  }

  /**
   * See {@link DecodeResultBase.mapInput}
   */
  mapInput<In2>(f: (i: In) => In2): DecodeResult<In2, Out, Err> {
    return failure(f(this.input), ...this.failures)
  }

  /**
   * See {@link DecodeResultBase.isSuccess}
   */
  isSuccess(): this is DecodeSuccess<In, Out, Err> {
    return false
  }

  /**
   * See {@link DecodeResultBase.isFailure}
   */
  isFailure(): this is DecodeFailure<In, Out, Err> {
    return true
  }

  /**
   * See {@link DecodeResultBase.getUnsafeSuccess}
   */
  getUnsafeSuccess(): Out {
    throw new Error("can't get success from failure")
  }

  /**
   * See {@link DecodeResultBase.getUnsafeFailure}
   */
  getUnsafeFailures(): Err[] {
    return this.failures
  }

  /**
   * Provides a human readable representation of the value. Mostly for debugging.
   */
  toString(): string {
    return `DecodeFailure<${JSON.stringify(this.failures)}>: ${JSON.stringify(this.input)}`
  }
}

/**
 * `DecodeResult` it's an either type, aunion type of two possible constructors.
 * It can either be:
 *
 * * `DecodeSuccess`: a decoder was able to successfully decode a value
 * * `DecodeFailure`: a decoder failed to decode a value
 *
 * A `DecodeResult` brings three type parameters like in `{@link Decoder}`:
 *
 * * `In`: The input stream for a decoder.
 * * `Out`: The expected result from a decoder.
 * * `Err`: The type that contains information on why a decoder failed.
 */
export type DecodeResult<In, Out, Err> = DecodeSuccess<In, Out, Err> | DecodeFailure<In, Out, Err>

/**
 * Helper function to create an instance of `DecodeResult` from a succeeded decoding.
 */
export const success = <In, Out, Err>(input: In, result: Out): DecodeResult<In, Out, Err> =>
  new DecodeSuccess(input, result)

/**
 * Helper function to create an instance of `DecodeResult` from a failed decoding.
 */
export const failure = <In, Out, Err>(input: In, ...failures: Err[]): DecodeResult<In, Out, Err> =>
  new DecodeFailure(input, ...failures)
