import { ParseResult } from './parse_result';
import { TupleToUnion } from './type_level';
export declare type Parsing<Out, Err, In> = (input: In) => ParseResult<Out, Err, In>;
export declare class Parser<Out, Err, In> {
    readonly run: (input: In) => ParseResult<Out, Err, In>;
    static of<Out, Err, In>(run: (input: In) => ParseResult<Out, Err, In>): Parser<Out, Err, In>;
    static ofGuaranteed<Out, Err, In>(run: (input: In) => [In, Out]): Parser<Out, Err, In>;
    constructor(run: (input: In) => ParseResult<Out, Err, In>);
    flatMap<Out2>(fun: (res: Out) => Parser<Out2, Err, In>): Parser<Out2, Err, In>;
    map<Dest>(fun: (res: Out) => Dest): Parser<Dest, Err, In>;
    flatMapError<E>(fun: (res: Err) => Parser<Out, E, In>): Parser<Out, E, In>;
    mapError<OtherFailure>(fun: (e: Err) => OtherFailure): Parser<Out, OtherFailure, In>;
    pickNext<Dest>(next: Parser<Dest, Err, In>): Parser<Dest, Err, In>;
    skipNext<Next>(next: Parser<Next, Err, In>): Parser<Out, Err, In>;
    join<Other>(other: Parser<Other, Err, In>): Parser<[Out, Other], Err, In>;
    or<U extends any[]>(...parsers: {
        [P in keyof U]: Parser<U[P], Err, In>;
    }): Parser<Out | TupleToUnion<U>, Err, In>;
    repeatAtLeast(times?: number): Parser<Out[], Err, In>;
    repeatBetween(min: number, max: number): Parser<Out[], Err, In>;
    repeat(times: number): Parser<Out[], Err, In>;
    repeatAtMost(times: number): Parser<Out[], Err, In>;
    separatedByAtLeastOnce<Separator>(separator: Parser<Separator, Err, In>): Parser<Out[], Err, In>;
    separatedBy<Separator>(separator: Parser<Separator, Err, In>): Parser<Out[], Err, In>;
    test(predicate: (r: Out) => boolean, failure: Err): Parser<Out, Err, In>;
    probe(f: (v: ParseResult<Out, Err, In>) => void): Parser<Out, Err, In>;
    withResult<Dest>(value: Dest): Parser<Dest, Err, In>;
    withFailure<E>(e: E): Parser<Out, E, In>;
}
export declare const sequence: <U extends any[], Err, In>(...parsers: { [P in keyof U]: Parser<U[P], Err, In>; }) => Parser<{ [P in keyof U]: U[P]; }, Err, In>;
export declare const oneOf: <U extends any[], Err, In>(...parsers: { [P in keyof U]: Parser<U[P], Err, In>; }) => Parser<U[number], Err, In>;
export declare const succeed: <Out, Err, In>(r: Out) => Parser<Out, Err, In>;
export declare const fail: <Out, Err, In>(f: Err) => Parser<Out, Err, In>;
export declare const lazy: <Out, Err, In>(f: () => Parser<Out, Err, In>) => Parser<Out, Err, In>;
