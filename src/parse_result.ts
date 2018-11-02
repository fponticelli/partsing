abstract class ParseResultBase<In, Out, Err> {
  constructor(
    readonly input: In
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<In, Out, Err>) => O,
    failure: (f: ParseFailure<In, Out, Err>) => O
  }): O
    
  abstract flatMap<O>(f: (r: Out) => ParseResult<In, O, Err>): ParseResult<In, O, Err>
  abstract flatMapError<E>(f: (r: Err) => ParseResult<In, Out, E>): ParseResult<In, Out, E>
  
  abstract map<O>(f: (r: Out) => O): ParseResult<In, O, Err>
  abstract mapError<E>(f: (r: Err) => E): ParseResult<In, Out, E>

  abstract isSuccess(): this is ParseSuccess<In, Out, Err>
  abstract isFailure(): this is ParseFailure<In, Out, Err>

  abstract getUnsafeSuccess(): Out
  abstract getUnsafeFailure(): Err

  abstract toString(): string
}

export class ParseSuccess<In, Out, Err> extends ParseResultBase<In, Out, Err> {
  readonly kind = 'parse-success'
  constructor(
    input: In,
    readonly value: Out
  ) {
    super(input)
  }

  match<O>(o: {
    success: (s: ParseSuccess<In, Out, Err>) => O,
    failure: (f: ParseFailure<In, Out, Err>) => O
  }): O {
    return o.success(this)
  }

  flatMap<Out2>(f: (r: Out) => ParseResult<In, Out2, Err>): ParseResult<In, Out2, Err> {
    return f(this.value)
  }
  map<Out2>(f: (r: Out) => Out2): ParseResult<In, Out2, Err> {
    return this.flatMap(v => new ParseSuccess(this.input, f(v)))
  }
  flatMapError<E>(f: (r: Err) => ParseResult<In, Out, E>): ParseResult<In, Out, E> {
    return new ParseSuccess(this.input, this.value)
  }
  mapError<E>(f: (r: Err) => E): ParseResult<In, Out, E> {
    return new ParseSuccess(this.input, this.value)
  }

  isSuccess(): this is ParseSuccess<In, Out, Err> {
    return true
  }
  isFailure(): this is ParseFailure<In, Out, Err> {
    return false
  }
  
  getUnsafeSuccess(): Out {
    return this.value
  }
  getUnsafeFailure(): Err {
    throw new Error('can\'t get failure from success')
  }

  toString(): string {
    return `ParseSuccess<${JSON.stringify(this.value)}>: ${JSON.stringify(this.input)}`
  }
}

export class ParseFailure<In, Out, Err> extends ParseResultBase<In, Out, Err> {
  readonly kind = 'parse-failure'
  constructor(
    input: In,
    readonly failure: Err
  ) {
    super(input)
  }

  match<O>(o: {
    success: (succ: ParseSuccess<In, Out, Err>) => O,
    failure: (fail: ParseFailure<In, Out, Err>) => O
  }): O {
    return o.failure(this)
  }

  flatMap<Out2>(f: (r: Out) => ParseResult<In, Out2, Err>): ParseResult<In, Out2, Err> {
    return new ParseFailure(this.input, this.failure)
  }
  map<Out2>(f: (r: Out) => Out2): ParseResult<In, Out2, Err> {
    return new ParseFailure(this.input, this.failure)
  }
  flatMapError<E>(f: (r: Err) => ParseResult<In, Out, E>): ParseResult<In, Out, E> {
    return f(this.failure)
  }
  mapError<E>(f: (r: Err) => E): ParseResult<In, Out, E> {
    return this.flatMapError(e => new ParseFailure(this.input, f(e)))
  }

  isSuccess(): this is ParseSuccess<In, Out, Err> {
    return false
  }
  isFailure(): this is ParseFailure<In, Out, Err> {
    return true
  }
  getUnsafeSuccess(): Out {
    throw new Error('can\'t get success from failure')
  }
  getUnsafeFailure(): Err {
    return this.failure
  }

  toString(): string {
    return `ParseFailure<${JSON.stringify(this.failure)}>: ${JSON.stringify(this.input)}`
  }
}

export type ParseResult<In, Out, Err> = ParseSuccess<In, Out, Err> | ParseFailure<In, Out, Err>

export const ParseResult = {
  success: <In, Out, Err>(input: In, result: Out): ParseResult<In, Out, Err> =>
    new ParseSuccess(input, result),
  failure: <In, Out, Err>(input: In, failure: Err): ParseResult<In, Out, Err> =>
    new ParseFailure(input, failure)  
}