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
 * @module core
 */

/**
 * DecodeResult is a union type that has two possible constructors
 * {@link DecodeSuccess} and {@link DecodeFailure}.
 */
abstract class DecodeResultBase<In, Out, Err> {
  readonly _I!: In
  readonly _O!: Out
  readonly _E!: Err

  constructor(readonly input: In) {}
  abstract match<O>(o: {
    success: (s: DecodeSuccess<In, Out, Err>) => O
    failure: (f: DecodeFailure<In, Out, Err>) => O
  }): O

  abstract flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err>
  abstract flatMapError<Err2>(f: (r: Err[]) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2>

  abstract map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err>
  abstract mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2>
  abstract mapInput<In2>(f: (i: In) => In2): DecodeResult<In2, Out, Err>

  abstract isSuccess(): this is DecodeSuccess<In, Out, Err>
  abstract isFailure(): this is DecodeFailure<In, Out, Err>

  abstract getUnsafeSuccess(): Out
  abstract getUnsafeFailures(): Err[]

  abstract toString(): string
}

export class DecodeSuccess<In, Out, Err> extends DecodeResultBase<In, Out, Err> {
  readonly kind = 'decode-success'
  constructor(input: In, readonly value: Out) {
    super(input)
  }

  match<O>(o: { success: (s: DecodeSuccess<In, Out, Err>) => O; failure: (f: DecodeFailure<In, Out, Err>) => O }): O {
    return o.success(this)
  }

  flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err> {
    return f(this.value)
  }
  map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err> {
    return this.flatMap(v => new DecodeSuccess(this.input, f(v)))
  }
  flatMapError<Err2>(f: (r: Err[]) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2> {
    return new DecodeSuccess(this.input, this.value)
  }
  mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2> {
    return new DecodeSuccess(this.input, this.value)
  }
  mapInput<In2>(f: (i: In) => In2): DecodeResult<In2, Out, Err> {
    return new DecodeSuccess(f(this.input), this.value)
  }

  isSuccess(): this is DecodeSuccess<In, Out, Err> {
    return true
  }
  isFailure(): this is DecodeFailure<In, Out, Err> {
    return false
  }

  getUnsafeSuccess(): Out {
    return this.value
  }
  getUnsafeFailures(): Err[] {
    throw new Error("can't get failures from success")
  }

  toString(): string {
    return `DecodeSuccess<${JSON.stringify(this.value)}>: ${JSON.stringify(this.input)}`
  }
}

export class DecodeFailure<In, Out, Err> extends DecodeResultBase<In, Out, Err> {
  readonly kind = 'decode-failure'
  readonly failures: Err[]
  constructor(input: In, ...failures: Err[]) {
    super(input)
    this.failures = failures
  }

  match<O>(o: {
    success: (succ: DecodeSuccess<In, Out, Err>) => O
    failure: (fail: DecodeFailure<In, Out, Err>) => O
  }): O {
    return o.failure(this)
  }

  flatMap<Out2>(f: (r: Out) => DecodeResult<In, Out2, Err>): DecodeResult<In, Out2, Err> {
    return new DecodeFailure(this.input, ...this.failures)
  }
  map<Out2>(f: (r: Out) => Out2): DecodeResult<In, Out2, Err> {
    return new DecodeFailure(this.input, ...this.failures)
  }
  flatMapError<Err2>(f: (r: Err[]) => DecodeResult<In, Out, Err2>): DecodeResult<In, Out, Err2> {
    return f(this.failures)
  }
  mapError<Err2>(f: (r: Err) => Err2): DecodeResult<In, Out, Err2> {
    return failure(this.input, ...this.failures.map(f))
  }
  mapInput<In2>(f: (i: In) => In2): DecodeResult<In2, Out, Err> {
    return failure(f(this.input), ...this.failures)
  }

  isSuccess(): this is DecodeSuccess<In, Out, Err> {
    return false
  }
  isFailure(): this is DecodeFailure<In, Out, Err> {
    return true
  }
  getUnsafeSuccess(): Out {
    throw new Error("can't get success from failure")
  }
  getUnsafeFailures(): Err[] {
    return this.failures
  }

  toString(): string {
    return `DecodeFailure<${JSON.stringify(this.failures)}>: ${JSON.stringify(this.input)}`
  }
}

export type DecodeResult<In, Out, Err> = DecodeSuccess<In, Out, Err> | DecodeFailure<In, Out, Err>

export const success = <In, Out, Err>(input: In, result: Out): DecodeResult<In, Out, Err> =>
  new DecodeSuccess(input, result)
export const failure = <In, Out, Err>(input: In, ...failures: Err[]): DecodeResult<In, Out, Err> =>
  new DecodeFailure(input, ...failures)
