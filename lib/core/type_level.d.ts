export declare type TupleToUnion<T extends any[]> = T[number] | never;
export declare type Output<T extends {
    _O: any;
}> = T['_O'];
export declare type Input<T extends {
    _I: any;
}> = T['_I'];
export declare type Error<T extends {
    _E: any;
}> = T['_E'];
export declare type MarkOptionalFields<T, U extends any[], K extends keyof T = keyof T> = {
    [k in Exclude<keyof T, TupleToUnion<U>>]: T[k];
} & {
    [k in TupleToUnion<U>]+?: T[k];
};
