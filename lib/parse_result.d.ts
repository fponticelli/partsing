declare abstract class ParseResultBase<Result, Failure, Source> {
    readonly source: Source;
    constructor(source: Source);
    abstract match<O>(o: {
        success: (s: ParseSuccess<Result, Failure, Source>) => O;
        failure: (f: ParseFailure<Result, Failure, Source>) => O;
    }): O;
    abstract flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
    abstract flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source>;
    abstract map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source>;
    abstract mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source>;
    abstract isSuccess(): this is ParseSuccess<Result, Failure, Source>;
    abstract isFailure(): this is ParseFailure<Result, Failure, Source>;
    abstract getUnsafeSuccess(): Result;
    abstract getUnsafeFailure(): Failure;
    abstract toString(): string;
}
export declare class ParseSuccess<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
    readonly value: Result;
    readonly kind = "parse-success";
    constructor(source: Source, value: Result);
    match<O>(o: {
        success: (s: ParseSuccess<Result, Failure, Source>) => O;
        failure: (f: ParseFailure<Result, Failure, Source>) => O;
    }): O;
    flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
    map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source>;
    flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source>;
    mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source>;
    isSuccess(): this is ParseSuccess<Result, Failure, Source>;
    isFailure(): this is ParseFailure<Result, Failure, Source>;
    getUnsafeSuccess(): Result;
    getUnsafeFailure(): Failure;
    toString(): string;
}
export declare class ParseFailure<Result, Failure, Source> extends ParseResultBase<Result, Failure, Source> {
    readonly failure: Failure;
    readonly kind = "parse-failure";
    constructor(source: Source, failure: Failure);
    match<O>(o: {
        success: (succ: ParseSuccess<Result, Failure, Source>) => O;
        failure: (fail: ParseFailure<Result, Failure, Source>) => O;
    }): O;
    flatMap<O>(f: (r: Result) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
    map<O>(f: (r: Result) => O): ParseResult<O, Failure, Source>;
    flatMapError<E>(f: (r: Failure) => ParseResult<Result, E, Source>): ParseResult<Result, E, Source>;
    mapError<E>(f: (r: Failure) => E): ParseResult<Result, E, Source>;
    isSuccess(): this is ParseSuccess<Result, Failure, Source>;
    isFailure(): this is ParseFailure<Result, Failure, Source>;
    getUnsafeSuccess(): Result;
    getUnsafeFailure(): Failure;
    toString(): string;
}
export declare type ParseResult<Result, Failure, Source> = ParseSuccess<Result, Failure, Source> | ParseFailure<Result, Failure, Source>;
export declare const ParseResult: {
    success: <Result, Failure, Source>(source: Source, result: Result) => ParseResult<Result, Failure, Source>;
    failure: <Result, Failure, Source>(source: Source, failure: Failure) => ParseResult<Result, Failure, Source>;
};
export {};
