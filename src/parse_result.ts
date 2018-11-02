abstract class ParseResultBase<Out, Err, In> {
  constructor(
    readonly input: In
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<Out, Err, In>) => O,
    failure: (f: ParseFailure<Out, Err, In>) => O
  }): O
    
  abstract flatMap<O>(f: (r: Out) => ParseResult<O, Err, In>): ParseResult<O, Err, In>
  abstract flatMapError<E>(f: (r: Err) => ParseResult<Out, E, In>): ParseResult<Out, E, In>
  
  abstract map<O>(f: (r: Out) => O): ParseResult<O, Err, In>
  abstract mapError<E>(f: (r: Err) => E): ParseResult<Out, E, In>

  abstract isSuccess(): this is ParseSuccess<Out, Err, In>
  abstract isFailure(): this is ParseFailure<Out, Err, In>

  abstract getUnsafeSuccess(): Out
  abstract getUnsafeFailure(): Err

  abstract toString(): string
}

export class ParseSuccess<Out, Err, In> extends ParseResultBase<Out, Err, In> {
  readonly kind = 'parse-success'
  constructor(
    input: In,
    readonly value: Out
  ) {
    super(input)
  }

  match<O>(o: {
    success: (s: ParseSuccess<Out, Err, In>) => O,
    failure: (f: ParseFailure<Out, Err, In>) => O
  }): O {
    return o.success(this)
  }

  flatMap<Out2>(f: (r: Out) => ParseResult<Out2, Err, In>): ParseResult<Out2, Err, In> {
    return f(this.value)
  }
  map<Out2>(f: (r: Out) => Out2): ParseResult<Out2, Err, In> {
    return this.flatMap(v => new ParseSuccess(this.input, f(v)))
  }
  flatMapError<E>(f: (r: Err) => ParseResult<Out, E, In>): ParseResult<Out, E, In> {
    return new ParseSuccess(this.input, this.value)
  }
  mapError<E>(f: (r: Err) => E): ParseResult<Out, E, In> {
    return new ParseSuccess(this.input, this.value)
  }

  isSuccess(): this is ParseSuccess<Out, Err, In> {
    return true
  }
  isFailure(): this is ParseFailure<Out, Err, In> {
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

export class ParseFailure<Out, Err, In> extends ParseResultBase<Out, Err, In> {
  readonly kind = 'parse-failure'
  constructor(
    input: In,
    readonly failure: Err
  ) {
    super(input)
  }

  match<O>(o: {
    success: (succ: ParseSuccess<Out, Err, In>) => O,
    failure: (fail: ParseFailure<Out, Err, In>) => O
  }): O {
    return o.failure(this)
  }

  flatMap<Out2>(f: (r: Out) => ParseResult<Out2, Err, In>): ParseResult<Out2, Err, In> {
    return new ParseFailure(this.input, this.failure)
  }
  map<Out2>(f: (r: Out) => Out2): ParseResult<Out2, Err, In> {
    return new ParseFailure(this.input, this.failure)
  }
  flatMapError<E>(f: (r: Err) => ParseResult<Out, E, In>): ParseResult<Out, E, In> {
    return f(this.failure)
  }
  mapError<E>(f: (r: Err) => E): ParseResult<Out, E, In> {
    return this.flatMapError(e => new ParseFailure(this.input, f(e)))
  }

  isSuccess(): this is ParseSuccess<Out, Err, In> {
    return false
  }
  isFailure(): this is ParseFailure<Out, Err, In> {
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

export type ParseResult<Out, Err, In> = ParseSuccess<Out, Err, In> | ParseFailure<Out, Err, In>

export const ParseResult = {
  success: <Out, Err, In>(input: In, result: Out): ParseResult<Out, Err, In> =>
    new ParseSuccess(input, result),
  failure: <Out, Err, In>(input: In, failure: Err): ParseResult<Out, Err, In> =>
    new ParseFailure(input, failure)  
}