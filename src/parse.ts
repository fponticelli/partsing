import { match } from './parse_text';
abstract class ParseResultBase<Result, Failure, Source> {
  constructor(
    readonly source: Source | undefined
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<Result, Failure, Source>) => O,
    failure: (f: ParseFailure<Result, Failure, Source>) => O
  }): O;
    
  abstract flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
  abstract flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source>;
  
  abstract map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source>;
  abstract mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source>;
}

export class ParseSuccess<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
  readonly kind = 'parse-success'
  constructor(
    source: Source | undefined,
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
}

export class ParseFailure<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
  readonly kind = 'parse-failure'
  constructor(
    source: Source | undefined,
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
}

export type ParseResult<Result, Failure, Source> = ParseSuccess<Result, Failure, Source> | ParseFailure<Result, Failure, Source>;

export type Parsing<Source, Result, Failure> = (source: Source) => ParseResult<Result, Failure, Source>;

export class Parser<Source, Result, Failure> {
  constructor(readonly run: (source: Source) => ParseResult<Result, Failure, Source>) {}

  flatMap<Dest>(fun: (res: Result) => Parser<Source, Dest, Failure>): Parser<Source, Dest, Failure> {
    return new Parser((source: Source) => {
      return this.run(source).match<ParseResult<Dest, Failure, Source>>({
        failure: (f: ParseFailure<Result, Failure, Source>) => new ParseFailure(f.source, f.failure),
        success: (s: ParseSuccess<Result, Failure, Source>) => fun(s.value).run(s.source)
      })
    })
  }
  
  map<Dest>(fun: (res: Result) => Dest): Parser<Source, Dest, Failure> {
    return this.flatMap(r => new Parser((source: Source) => {
      return this.run(source).map(fun)
    }))
  }
  
  mapError<OtherFailure>(fun: (e: Failure) => OtherFailure): Parser<Source, Result, OtherFailure> {
    return new Parser<Source, Result, OtherFailure>((source: Source) => {
      return this.run(source).match<ParseResult<Result, OtherFailure, Source>>({
        failure: (f: ParseFailure<Result, Failure, Source>) => new ParseFailure<Result, OtherFailure, Source>(f.source, fun(f.failure)),
        success: s => new ParseSuccess<Result, OtherFailure, Source>(s.source, s.value)
      })
    })
  }

  then<Dest>(next: Parser<Source, Dest, Failure>): Parser<Source, Dest, Failure> {
    return this.flatMap(_ => next)
  }

  result<Dest>(value: Dest): Parser<Source, Dest, Failure> {
    return this.map(_ => value)
  }

  skip<Next>(next: Parser<Source, Next, Failure>): Parser<Source, Result, Failure> {
    return this.flatMap(r => next.result(r))
  }
}

