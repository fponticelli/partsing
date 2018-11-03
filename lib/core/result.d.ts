declare abstract class ParseResultBase<In, Out, Err> {
    readonly input: In;
    constructor(input: In);
    abstract match<O>(o: {
        success: (s: ParseSuccess<In, Out, Err>) => O;
        failure: (f: ParseFailure<In, Out, Err>) => O;
    }): O;
    abstract flatMap<Out2>(f: (r: Out) => ParseResult<In, Out2, Err>): ParseResult<In, Out2, Err>;
    abstract flatMapError<Err2>(f: (r: Err) => ParseResult<In, Out, Err2>): ParseResult<In, Out, Err2>;
    abstract map<Out2>(f: (r: Out) => Out2): ParseResult<In, Out2, Err>;
    abstract mapError<Err2>(f: (r: Err) => Err2): ParseResult<In, Out, Err2>;
    abstract isSuccess(): this is ParseSuccess<In, Out, Err>;
    abstract isFailure(): this is ParseFailure<In, Out, Err>;
    abstract getUnsafeSuccess(): Out;
    abstract getUnsafeFailure(): Err;
    abstract toString(): string;
}
export declare class ParseSuccess<In, Out, Err> extends ParseResultBase<In, Out, Err> {
    readonly value: Out;
    readonly kind = "parse-success";
    constructor(input: In, value: Out);
    match<O>(o: {
        success: (s: ParseSuccess<In, Out, Err>) => O;
        failure: (f: ParseFailure<In, Out, Err>) => O;
    }): O;
    flatMap<Out2>(f: (r: Out) => ParseResult<In, Out2, Err>): ParseResult<In, Out2, Err>;
    map<Out2>(f: (r: Out) => Out2): ParseResult<In, Out2, Err>;
    flatMapError<Err2>(f: (r: Err) => ParseResult<In, Out, Err2>): ParseResult<In, Out, Err2>;
    mapError<Err2>(f: (r: Err) => Err2): ParseResult<In, Out, Err2>;
    isSuccess(): this is ParseSuccess<In, Out, Err>;
    isFailure(): this is ParseFailure<In, Out, Err>;
    getUnsafeSuccess(): Out;
    getUnsafeFailure(): Err;
    toString(): string;
}
export declare class ParseFailure<In, Out, Err> extends ParseResultBase<In, Out, Err> {
    readonly failure: Err;
    readonly kind = "parse-failure";
    constructor(input: In, failure: Err);
    match<O>(o: {
        success: (succ: ParseSuccess<In, Out, Err>) => O;
        failure: (fail: ParseFailure<In, Out, Err>) => O;
    }): O;
    flatMap<Out2>(f: (r: Out) => ParseResult<In, Out2, Err>): ParseResult<In, Out2, Err>;
    map<Out2>(f: (r: Out) => Out2): ParseResult<In, Out2, Err>;
    flatMapError<Err2>(f: (r: Err) => ParseResult<In, Out, Err2>): ParseResult<In, Out, Err2>;
    mapError<Err2>(f: (r: Err) => Err2): ParseResult<In, Out, Err2>;
    isSuccess(): this is ParseSuccess<In, Out, Err>;
    isFailure(): this is ParseFailure<In, Out, Err>;
    getUnsafeSuccess(): Out;
    getUnsafeFailure(): Err;
    toString(): string;
}
export declare type ParseResult<In, Out, Err> = ParseSuccess<In, Out, Err> | ParseFailure<In, Out, Err>;
export declare const ParseResult: {
    success: <In, Out, Err>(input: In, result: Out) => ParseResult<In, Out, Err>;
    failure: <In, Out, Err>(input: In, failure: Err) => ParseResult<In, Out, Err>;
};
export {};
