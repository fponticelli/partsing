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
    toString(): string;
}
export declare type ParseResult<Result, Failure, Source> = ParseSuccess<Result, Failure, Source> | ParseFailure<Result, Failure, Source>;
export declare type Parsing<Result, Failure, Source> = (source: Source) => ParseResult<Result, Failure, Source>;
export declare class Parser<Result, Failure, Source> {
    readonly run: (source: Source) => ParseResult<Result, Failure, Source>;
    constructor(run: (source: Source) => ParseResult<Result, Failure, Source>);
    flatMap<Dest>(fun: (res: Result) => Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source>;
    map<Dest>(fun: (res: Result) => Dest): Parser<Dest, Failure, Source>;
    flatMapError<E>(fun: (res: Failure) => Parser<Result, E, Source>): Parser<Result, E, Source>;
    mapError<OtherFailure>(fun: (e: Failure) => OtherFailure): Parser<Result, OtherFailure, Source>;
    then<Dest>(next: Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source>;
    result<Dest>(value: Dest): Parser<Dest, Failure, Source>;
    skip<Next>(next: Parser<Next, Failure, Source>): Parser<Result, Failure, Source>;
    join<U extends any[]>(...parsers: {
        [P in keyof U]: Parser<U[P], Failure, Source>;
    }): Parser<[Result] | {
        [P in keyof U]: U[P];
    }, Failure, Source>;
    or<U extends any[]>(...parsers: {
        [P in keyof U]: Parser<U[P], Failure, Source>;
    }): Parser<Result | TupleToUnion<U>, Failure, Source>;
    many(atLeast?: number): Parser<Result[], Failure, Source>;
    between(min: number, max: number): Parser<Result[], Failure, Source>;
    times(count: number): Parser<Result[], Failure, Source>;
    atMost(times: number): Parser<Result[], Failure, Source>;
    separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Result[], Failure, Source>;
    separatedBy<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Result[] | never[], Failure, Source>;
    probe(f: (v: ParseResult<Result, Failure, Source>) => void): Parser<Result, Failure, Source>;
}
export declare const seq: <U extends any[], Source, Failure>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source>; }) => Parser<{ [P in keyof U]: U[P]; }, Failure, Source>;
declare type TupleToUnion<T extends any[]> = T[number] | never;
export declare const alt: <U extends any[], Source, Failure>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source>; }) => Parser<U[number], Failure, Source>;
export declare const succeed: <Result, Failure, Source>(r: Result) => Parser<Result, Failure, Source>;
export declare const fail: <Result, Failure, Source>(f: Failure) => Parser<Result, Failure, Source>;
export declare const many: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, atLeast?: number) => Parser<Result[], Failure, Source>;
export declare const between: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, min: number, max: number) => Parser<Result[], Failure, Source>;
export declare const times: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, count: number) => Parser<Result[], Failure, Source>;
export declare const atMost: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, times: number) => Parser<Result[], Failure, Source>;
export declare const separatedByAtLeastOnce: <Result, Separator, Failure, Source>(parser: Parser<Result, Failure, Source>, separator: Parser<Separator, Failure, Source>) => Parser<Result[], Failure, Source>;
export declare const separatedBy: <Result, Separator, Failure, Source>(parser: Parser<Result, Failure, Source>, separator: Parser<Separator, Failure, Source>) => Parser<never[] | Result[], Failure, Source>;
export {};
