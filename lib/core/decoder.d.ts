import { DecodeResult } from './result';
import { TupleToUnion } from './type_level';
export declare type Decoding<In, Out, Err> = (input: In) => DecodeResult<In, Out, Err>;
export declare class Decoder<In, Out, Err> {
    readonly run: (input: In) => DecodeResult<In, Out, Err>;
    static of<In, Out, Err>(run: (input: In) => DecodeResult<In, Out, Err>): Decoder<In, Out, Err>;
    static ofGuaranteed<In, Out, Err>(run: (input: In) => [In, Out]): Decoder<In, Out, Err>;
    readonly _I: In;
    readonly _O: Out;
    readonly _E: Err;
    constructor(run: (input: In) => DecodeResult<In, Out, Err>);
    flatMap<Out2>(fun: (res: Out) => Decoder<In, Out2, Err>): Decoder<In, Out2, Err>;
    map<Out2>(fun: (res: Out) => Out2): Decoder<In, Out2, Err>;
    sub<In2, Out2, Err2>(decoder: Decoder<In2, Out2, Err2>, mapInput: (o: Out) => In2, mapError: (e: Err2) => Err): Decoder<In, Out2, Err>;
    flatMapError<Err2>(fun: (res: Err) => Decoder<In, Out, Err2>): Decoder<In, Out, Err2>;
    mapError<Err2>(fun: (e: Err) => Err2): Decoder<In, Out, Err2>;
    pickNext<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, Out2, Err>;
    skipNext<Out2>(next: Decoder<In, Out2, Err>): Decoder<In, Out, Err>;
    join<Out2>(other: Decoder<In, Out2, Err>): Decoder<In, [Out, Out2], Err>;
    or<U extends any[]>(...decoders: {
        [P in keyof U]: Decoder<In, U[P], Err>;
    }): Decoder<In, Out | TupleToUnion<U>, Err>;
    repeatAtLeast(times?: number): Decoder<In, Out[], Err>;
    repeatBetween(min: number, max: number): Decoder<In, Out[], Err>;
    repeat(times: number): Decoder<In, Out[], Err>;
    repeatAtMost(times: number): Decoder<In, Out[], Err>;
    separatedByAtLeastOnce<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err>;
    separatedBy<Separator>(separator: Decoder<In, Separator, Err>): Decoder<In, Out[], Err>;
    separatedByTimes<Separator>(separator: Decoder<In, Separator, Err>, times: number): Decoder<In, Out[], Err>;
    test(predicate: (r: Out) => boolean, failure: Err): Decoder<In, Out, Err>;
    probe(f: (v: DecodeResult<In, Out, Err>) => void): Decoder<In, Out, Err>;
    withResult<Out2>(value: Out2): Decoder<In, Out2, Err>;
    withFailure<Err2>(e: Err2): Decoder<In, Out, Err2>;
}
export declare const sequence: <In, U extends any[], Err>(...decoders: { [P in keyof U]: Decoder<In, U[P], Err>; }) => Decoder<In, { [P in keyof U]: U[P]; }, Err>;
export declare const oneOf: <In, U extends any[], Err>(...decoders: { [P in keyof U]: Decoder<In, U[P], Err>; }) => Decoder<In, U[number], Err>;
export declare const succeed: <In, Out, Err>(r: Out) => Decoder<In, Out, Err>;
export declare const fail: <In, Out, Err>(f: Err) => Decoder<In, Out, Err>;
export declare const lazy: <In, Out, Err>(f: () => Decoder<In, Out, Err>) => Decoder<In, Out, Err>;
