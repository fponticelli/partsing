declare abstract class ParseResultBase<Out, Err, In> {
    readonly input: In;
    constructor(input: In);
    abstract match<O>(o: {
        success: (s: ParseSuccess<Out, Err, In>) => O;
        failure: (f: ParseFailure<Out, Err, In>) => O;
    }): O;
    abstract flatMap<O>(f: (r: Out) => ParseResult<O, Err, In>): ParseResult<O, Err, In>;
    abstract flatMapError<E>(f: (r: Err) => ParseResult<Out, E, In>): ParseResult<Out, E, In>;
    abstract map<O>(f: (r: Out) => O): ParseResult<O, Err, In>;
    abstract mapError<E>(f: (r: Err) => E): ParseResult<Out, E, In>;
    abstract isSuccess(): this is ParseSuccess<Out, Err, In>;
    abstract isFailure(): this is ParseFailure<Out, Err, In>;
    abstract getUnsafeSuccess(): Out;
    abstract getUnsafeFailure(): Err;
    abstract toString(): string;
}
export declare class ParseSuccess<Out, Err, In> extends ParseResultBase<Out, Err, In> {
    readonly value: Out;
    readonly kind = "parse-success";
    constructor(input: In, value: Out);
    match<O>(o: {
        success: (s: ParseSuccess<Out, Err, In>) => O;
        failure: (f: ParseFailure<Out, Err, In>) => O;
    }): O;
    flatMap<Out2>(f: (r: Out) => ParseResult<Out2, Err, In>): ParseResult<Out2, Err, In>;
    map<Out2>(f: (r: Out) => Out2): ParseResult<Out2, Err, In>;
    flatMapError<E>(f: (r: Err) => ParseResult<Out, E, In>): ParseResult<Out, E, In>;
    mapError<E>(f: (r: Err) => E): ParseResult<Out, E, In>;
    isSuccess(): this is ParseSuccess<Out, Err, In>;
    isFailure(): this is ParseFailure<Out, Err, In>;
    getUnsafeSuccess(): Out;
    getUnsafeFailure(): Err;
    toString(): string;
}
export declare class ParseFailure<Out, Err, In> extends ParseResultBase<Out, Err, In> {
    readonly failure: Err;
    readonly kind = "parse-failure";
    constructor(input: In, failure: Err);
    match<O>(o: {
        success: (succ: ParseSuccess<Out, Err, In>) => O;
        failure: (fail: ParseFailure<Out, Err, In>) => O;
    }): O;
    flatMap<Out2>(f: (r: Out) => ParseResult<Out2, Err, In>): ParseResult<Out2, Err, In>;
    map<Out2>(f: (r: Out) => Out2): ParseResult<Out2, Err, In>;
    flatMapError<E>(f: (r: Err) => ParseResult<Out, E, In>): ParseResult<Out, E, In>;
    mapError<E>(f: (r: Err) => E): ParseResult<Out, E, In>;
    isSuccess(): this is ParseSuccess<Out, Err, In>;
    isFailure(): this is ParseFailure<Out, Err, In>;
    getUnsafeSuccess(): Out;
    getUnsafeFailure(): Err;
    toString(): string;
}
export declare type ParseResult<Out, Err, In> = ParseSuccess<Out, Err, In> | ParseFailure<Out, Err, In>;
export declare const ParseResult: {
    success: <Out, Err, In>(input: In, result: Out) => ParseResult<Out, Err, In>;
    failure: <Out, Err, In>(input: In, failure: Err) => ParseResult<Out, Err, In>;
};
export {};
