abstract class ParseResultBase<Result, Failure, Source> {
  constructor(
    readonly source: Source
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<Result, Failure, Source>) => O,
    failure: (f: ParseFailure<Result, Failure, Source>) => O
  }): O
    
  abstract flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>
  abstract flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source>
  
  abstract map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source>
  abstract mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source>

  abstract isSuccess(): this is ParseSuccess<Result, Failure, Source>
  abstract isFailure(): this is ParseFailure<Result, Failure, Source>

  abstract getUnsafeSuccess(): Result
  abstract getUnsafeFailure(): Failure

  abstract toString(): string
}

export class ParseSuccess<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
  readonly kind = 'parse-success'
  constructor(
    source: Source,
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

  isSuccess(): this is ParseSuccess<Result, Failure, Source> {
    return true
  }
  isFailure(): this is ParseFailure<Result, Failure, Source> {
    return false
  }
  
  getUnsafeSuccess(): Result {
    return this.value
  }
  getUnsafeFailure(): Failure {
    throw new Error('can\'t get failure from success')
  }

  toString(): string {
    return `ParseSuccess<${JSON.stringify(this.value)}>: ${JSON.stringify(this.source)}`
  }
}

export class ParseFailure<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
  readonly kind = 'parse-failure'
  constructor(
    source: Source,
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

  isSuccess(): this is ParseSuccess<Result, Failure, Source> {
    return false
  }
  isFailure(): this is ParseFailure<Result, Failure, Source> {
    return true
  }
  getUnsafeSuccess(): Result {
    throw new Error('can\'t get success from failure')
  }
  getUnsafeFailure(): Failure {
    return this.failure
  }

  toString(): string {
    return `ParseFailure<${JSON.stringify(this.failure)}>: ${JSON.stringify(this.source)}`
  }
}

export type ParseResult<Result, Failure, Source> = ParseSuccess<Result, Failure, Source> | ParseFailure<Result, Failure, Source>

export const ParseResult = {
  success: <Result, Failure, Source>(source: Source, result: Result): ParseResult<Result, Failure, Source> =>
    new ParseSuccess(source, result),
  failure: <Result, Failure, Source>(source: Source, failure: Failure): ParseResult<Result, Failure, Source> =>
    new ParseFailure(source, failure)  
}