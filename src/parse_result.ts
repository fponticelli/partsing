abstract class ParseResultBase<Success, Failure, Source> {
  constructor(
    readonly source: Source
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<Success, Failure, Source>) => O,
    failure: (f: ParseFailure<Success, Failure, Source>) => O
  }): O
    
  abstract flatMap<O>(f: (r: Success) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>
  abstract flatMapError<E>(f: (r: Failure) => ParseResult<Success, E, Source>): ParseResult<Success, E, Source>
  
  abstract map<O>(f: (r: Success) => O): ParseResult<O, Failure, Source>
  abstract mapError<E>(f: (r: Failure) => E): ParseResult<Success, E, Source>

  abstract isSuccess(): this is ParseSuccess<Success, Failure, Source>
  abstract isFailure(): this is ParseFailure<Success, Failure, Source>

  abstract getUnsafeSuccess(): Success
  abstract getUnsafeFailure(): Failure

  abstract toString(): string
}

export class ParseSuccess<Success, Failure, Source> extends ParseResultBase<Success, Failure, Source> {
  readonly kind = 'parse-success'
  constructor(
    source: Source,
    readonly value: Success
  ) {
    super(source)
  }

  match<O>(o: {
    success: (s: ParseSuccess<Success, Failure, Source>) => O,
    failure: (f: ParseFailure<Success, Failure, Source>) => O
  }): O {
    return o.success(this)
  }

  flatMap<O>(f: (r: Success) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source> {
    return f(this.value)
  }
  map<O>(f: (r: Success) => O): ParseResult<O, Failure, Source> {
    return this.flatMap(v => new ParseSuccess(this.source, f(v)))
  }
  flatMapError<E>(f: (r: Failure) => ParseResult<Success, E, Source>): ParseResult<Success, E, Source> {
    return new ParseSuccess(this.source, this.value)
  }
  mapError<E>(f: (r: Failure) => E): ParseResult<Success, E, Source> {
    return new ParseSuccess(this.source, this.value)
  }

  isSuccess(): this is ParseSuccess<Success, Failure, Source> {
    return true
  }
  isFailure(): this is ParseFailure<Success, Failure, Source> {
    return false
  }
  
  getUnsafeSuccess(): Success {
    return this.value
  }
  getUnsafeFailure(): Failure {
    throw new Error('can\'t get failure from success')
  }

  toString(): string {
    return `ParseSuccess<${JSON.stringify(this.value)}>: ${JSON.stringify(this.source)}`
  }
}

export class ParseFailure<Success, Failure, Source> extends ParseResultBase<Success, Failure, Source> {
  readonly kind = 'parse-failure'
  constructor(
    source: Source,
    readonly failure: Failure
  ) {
    super(source)
  }

  match<O>(o: {
    success: (succ: ParseSuccess<Success, Failure, Source>) => O,
    failure: (fail: ParseFailure<Success, Failure, Source>) => O
  }): O {
    return o.failure(this)
  }

  flatMap<O>(f: (r: Success) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source> {
    return new ParseFailure(this.source, this.failure)
  }
  map<O>(f: (r: Success) => O): ParseResult<O, Failure, Source> {
    return new ParseFailure(this.source, this.failure)
  }
  flatMapError<E>(f: (r: Failure) => ParseResult<Success, E, Source>): ParseResult<Success, E, Source> {
    return f(this.failure)
  }
  mapError<E>(f: (r: Failure) => E): ParseResult<Success, E, Source> {
    return this.flatMapError(e => new ParseFailure(this.source, f(e)))
  }

  isSuccess(): this is ParseSuccess<Success, Failure, Source> {
    return false
  }
  isFailure(): this is ParseFailure<Success, Failure, Source> {
    return true
  }
  getUnsafeSuccess(): Success {
    throw new Error('can\'t get success from failure')
  }
  getUnsafeFailure(): Failure {
    return this.failure
  }

  toString(): string {
    return `ParseFailure<${JSON.stringify(this.failure)}>: ${JSON.stringify(this.source)}`
  }
}

export type ParseResult<Success, Failure, Source> = ParseSuccess<Success, Failure, Source> | ParseFailure<Success, Failure, Source>

export const ParseResult = {
  success: <Success, Failure, Source>(source: Source, result: Success): ParseResult<Success, Failure, Source> =>
    new ParseSuccess(source, result),
  failure: <Success, Failure, Source>(source: Source, failure: Failure): ParseResult<Success, Failure, Source> =>
    new ParseFailure(source, failure)  
}