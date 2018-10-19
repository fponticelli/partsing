abstract class ParseResultBase<Result, Failure, Source> {
  constructor(
    readonly source: Source | undefined
  ) {}
  abstract match<O>(o: {
    success: (s: ParseSuccess<Result, Failure, Source>) => O,
    failure: (f: ParseFailure<Result, Failure, Source>) => O
  }): O;
    
  abstract flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
  abstract map<O>(f: (r: Result) => [Source, O]): ParseResult<O, Failure, Source>;
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
  map<O>(f: (r: Result) => [Source, O]): ParseResult<O, Failure, Source> {
    return this.flatMap(v => new ParseSuccess(...f(v)))
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
  map<O>(f: (r: Result) => [Source, O]): ParseResult<O, Failure, Source> {
    return new ParseFailure(this.source, this.failure)
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
  
  map<Dest>(fun: (res: Result) => [Source, Dest]): Parser<Source, Dest, Failure> {
    return this.flatMap(r => new Parser((source: Source) => {
      return this.run(source).map(fun)
    }))
  }
  
  mapValue<Dest>(fun: (res: Result) => Dest): Parser<Source, Dest, Failure> {
    return this.flatMap(r => new Parser((source: Source) => {
      return this.run(source).map(v => [source, fun(v)])
    }))
  }

  then<Dest>(next: Parser<Source, Dest, Failure>): Parser<Source, Dest, Failure> {
    return this.flatMap(_ => next)
  }

  result<Dest>(value: Dest): Parser<Source, Dest, Failure> {
    return this.mapValue(_ => value)
  }
}

