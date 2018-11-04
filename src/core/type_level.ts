import { Decoder } from './decoder'

export type TupleToUnion<T extends any[]> = T[number] | never

export type Output<T extends { _O: any }> = T['_O']
export type Input<T extends { _I: any }> = T['_I']
export type Error<T extends { _E: any }> = T['_E']