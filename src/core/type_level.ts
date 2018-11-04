import { Decoder } from './decoder'

export type TupleToUnion<T extends any[]> = T[number] | never

export type Output<T extends { _O: any }> = T['_O']
export type Input<T extends { _I: any }> = T['_I']
export type Error<T extends { _E: any }> = T['_E']

export type MarkOptionalFields<T, U extends any[], K extends keyof T = keyof T> =
  { [k in Exclude<keyof T, TupleToUnion<U>>]: T[k] } &
  { [k in TupleToUnion<U>]+?: T[k] }