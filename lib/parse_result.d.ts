declare abstract class ParseResultBase<Success, Failure, Source> {
    readonly source: Source;
    constructor(source: Source);
    abstract match<O>(o: {
        success: (s: ParseSuccess<Success, Failure, Source>) => O;
        failure: (f: ParseFailure<Success, Failure, Source>) => O;
    }): O;
    abstract flatMap<O>(f: (r: Success) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
    abstract flatMapError<E>(f: (r: Failure) => ParseResult<Success, E, Source>): ParseResult<Success, E, Source>;
    abstract map<O>(f: (r: Success) => O): ParseResult<O, Failure, Source>;
    abstract mapError<E>(f: (r: Failure) => E): ParseResult<Success, E, Source>;
    abstract isSuccess(): this is ParseSuccess<Success, Failure, Source>;
    abstract isFailure(): this is ParseFailure<Success, Failure, Source>;
    abstract getUnsafeSuccess(): Success;
    abstract getUnsafeFailure(): Failure;
    abstract toString(): string;
}
export declare class ParseSuccess<Success, Failure, Source> extends ParseResultBase<Success, Failure, Source> {
    readonly value: Success;
    readonly kind = "parse-success";
    constructor(source: Source, value: Success);
    match<O>(o: {
        success: (s: ParseSuccess<Success, Failure, Source>) => O;
        failure: (f: ParseFailure<Success, Failure, Source>) => O;
    }): O;
    flatMap<O>(f: (r: Success) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
    map<O>(f: (r: Success) => O): ParseResult<O, Failure, Source>;
    flatMapError<E>(f: (r: Failure) => ParseResult<Success, E, Source>): ParseResult<Success, E, Source>;
    mapError<E>(f: (r: Failure) => E): ParseResult<Success, E, Source>;
    isSuccess(): this is ParseSuccess<Success, Failure, Source>;
    isFailure(): this is ParseFailure<Success, Failure, Source>;
    getUnsafeSuccess(): Success;
    getUnsafeFailure(): Failure;
    toString(): string;
}
export declare class ParseFailure<Success, Failure, Source> extends ParseResultBase<Success, Failure, Source> {
    readonly failure: Failure;
    readonly kind = "parse-failure";
    constructor(source: Source, failure: Failure);
    match<O>(o: {
        success: (succ: ParseSuccess<Success, Failure, Source>) => O;
        failure: (fail: ParseFailure<Success, Failure, Source>) => O;
    }): O;
    flatMap<O>(f: (r: Success) => ParseResult<O, Failure, Source>): ParseResult<O, Failure, Source>;
    map<O>(f: (r: Success) => O): ParseResult<O, Failure, Source>;
    flatMapError<E>(f: (r: Failure) => ParseResult<Success, E, Source>): ParseResult<Success, E, Source>;
    mapError<E>(f: (r: Failure) => E): ParseResult<Success, E, Source>;
    isSuccess(): this is ParseSuccess<Success, Failure, Source>;
    isFailure(): this is ParseFailure<Success, Failure, Source>;
    getUnsafeSuccess(): Success;
    getUnsafeFailure(): Failure;
    toString(): string;
}
export declare type ParseResult<Success, Failure, Source> = ParseSuccess<Success, Failure, Source> | ParseFailure<Success, Failure, Source>;
export declare const ParseResult: {
    success: <Success, Failure, Source>(source: Source, result: Success) => ParseResult<Success, Failure, Source>;
    failure: <Success, Failure, Source>(source: Source, failure: Failure) => ParseResult<Success, Failure, Source>;
};
export {};
