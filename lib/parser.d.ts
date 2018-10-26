import { ParseResult } from './parse_result';
export declare type Parsing<Result, Failure, Source> = (source: Source) => ParseResult<Result, Failure, Source>;
export declare class Parser<Result, Failure, Source> {
    readonly run: (source: Source) => ParseResult<Result, Failure, Source>;
    static of<Result, Failure, Source>(run: (source: Source) => ParseResult<Result, Failure, Source>): Parser<Result, Failure, Source>;
    static ofGuaranteed<Result, Failure, Source>(run: (source: Source) => [Source, Result]): Parser<Result, Failure, Source>;
    constructor(run: (source: Source) => ParseResult<Result, Failure, Source>);
    flatMap<Dest>(fun: (res: Result) => Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source>;
    map<Dest>(fun: (res: Result) => Dest): Parser<Dest, Failure, Source>;
    flatMapError<E>(fun: (res: Failure) => Parser<Result, E, Source>): Parser<Result, E, Source>;
    mapError<OtherFailure>(fun: (e: Failure) => OtherFailure): Parser<Result, OtherFailure, Source>;
    then<Dest>(next: Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source>;
    result<Dest>(value: Dest): Parser<Dest, Failure, Source>;
    skip<Next>(next: Parser<Next, Failure, Source>): Parser<Result, Failure, Source>;
    join<Other>(other: Parser<Other, Failure, Source>): Parser<[Result, Other], Failure, Source>;
    or<U extends any[]>(...parsers: {
        [P in keyof U]: Parser<U[P], Failure, Source>;
    }): Parser<Result | TupleToUnion<U>, Failure, Source>;
    many(atLeast?: number): Parser<Result[], Failure, Source>;
    between(min: number, max: number): Parser<Result[], Failure, Source>;
    times(count: number): Parser<Result[], Failure, Source>;
    atMost(times: number): Parser<Result[], Failure, Source>;
    separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Result[], Failure, Source>;
    separatedBy<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Result[], Failure, Source>;
    probe(f: (v: ParseResult<Result, Failure, Source>) => void): Parser<Result, Failure, Source>;
}
export declare const seq: <U extends any[], Failure, Source>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source>; }) => Parser<{ [P in keyof U]: U[P]; }, Failure, Source>;
declare type TupleToUnion<T extends any[]> = T[number] | never;
export declare const alt: <U extends any[], Failure, Source>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source>; }) => Parser<U[number], Failure, Source>;
export declare const succeed: <Result, Failure, Source>(r: Result) => Parser<Result, Failure, Source>;
export declare const fail: <Result, Failure, Source>(f: Failure) => Parser<Result, Failure, Source>;
export declare const many: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, atLeast?: number) => Parser<Result[], Failure, Source>;
export declare const between: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, min: number, max: number) => Parser<Result[], Failure, Source>;
export declare const times: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, count: number) => Parser<Result[], Failure, Source>;
export declare const atMost: <Result, Failure, Source>(parser: Parser<Result, Failure, Source>, times: number) => Parser<Result[], Failure, Source>;
export declare const lazy: <Result, Failure, Source>(f: () => Parser<Result, Failure, Source>) => Parser<Result, Failure, Source>;
export {};
