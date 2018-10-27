import { ParseResult } from './parse_result';
export declare type Parsing<Success, Failure, Source> = (source: Source) => ParseResult<Success, Failure, Source>;
export declare class Parser<Success, Failure, Source> {
    readonly run: (source: Source) => ParseResult<Success, Failure, Source>;
    static of<Success, Failure, Source>(run: (source: Source) => ParseResult<Success, Failure, Source>): Parser<Success, Failure, Source>;
    static ofGuaranteed<Success, Failure, Source>(run: (source: Source) => [Source, Success]): Parser<Success, Failure, Source>;
    constructor(run: (source: Source) => ParseResult<Success, Failure, Source>);
    flatMap<Dest>(fun: (res: Success) => Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source>;
    map<Dest>(fun: (res: Success) => Dest): Parser<Dest, Failure, Source>;
    flatMapError<E>(fun: (res: Failure) => Parser<Success, E, Source>): Parser<Success, E, Source>;
    mapError<OtherFailure>(fun: (e: Failure) => OtherFailure): Parser<Success, OtherFailure, Source>;
    pickNext<Dest>(next: Parser<Dest, Failure, Source>): Parser<Dest, Failure, Source>;
    skipNext<Next>(next: Parser<Next, Failure, Source>): Parser<Success, Failure, Source>;
    join<Other>(other: Parser<Other, Failure, Source>): Parser<[Success, Other], Failure, Source>;
    or<U extends any[]>(...parsers: {
        [P in keyof U]: Parser<U[P], Failure, Source>;
    }): Parser<Success | TupleToUnion<U>, Failure, Source>;
    repeatAtLeast(times?: number): Parser<Success[], Failure, Source>;
    repeatBetween(min: number, max: number): Parser<Success[], Failure, Source>;
    repeat(times: number): Parser<Success[], Failure, Source>;
    repeatAtMost(times: number): Parser<Success[], Failure, Source>;
    separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Success[], Failure, Source>;
    separatedBy<Separator>(separator: Parser<Separator, Failure, Source>): Parser<Success[], Failure, Source>;
    probe(f: (v: ParseResult<Success, Failure, Source>) => void): Parser<Success, Failure, Source>;
    withResult<Dest>(value: Dest): Parser<Dest, Failure, Source>;
    withFailure<E>(e: E): Parser<Success, E, Source>;
}
export declare const sequence: <U extends any[], Failure, Source>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source>; }) => Parser<{ [P in keyof U]: U[P]; }, Failure, Source>;
declare type TupleToUnion<T extends any[]> = T[number] | never;
export declare const oneOf: <U extends any[], Failure, Source>(...parsers: { [P in keyof U]: Parser<U[P], Failure, Source>; }) => Parser<U[number], Failure, Source>;
export declare const succeed: <Success, Failure, Source>(r: Success) => Parser<Success, Failure, Source>;
export declare const fail: <Success, Failure, Source>(f: Failure) => Parser<Success, Failure, Source>;
export declare const lazy: <Success, Failure, Source>(f: () => Parser<Success, Failure, Source>) => Parser<Success, Failure, Source>;
export {};
