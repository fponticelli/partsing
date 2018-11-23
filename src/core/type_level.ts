/*
Copyright 2018 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * This module contains type-level functions for compile-time usage.
 */

/**
 * Transform a tuple type into the union of all the types in the tuple.
 */
export type TupleToUnion<T extends any[]> = T[number] | never

/**
 * Extracts the `Out` type from a `Decoder` type.
 */
export type Output<T extends { _O: any }> = T['_O']

/**
 * Extracts the `Int` type from a `Decoder` type.
 */
export type Input<T extends { _I: any }> = T['_I']

/**
 * Extracts the `Err` type from a `Decoder` type.
 */
export type Error<T extends { _E: any }> = T['_E']

/**
 * Given a type for an object `T` and an array `U` of field names from `U`,
 * return a new object type with the specified fields `U` marked as optional.
 */
export type MarkOptionalFields<T, U extends any[], K extends keyof T = keyof T> = {
  [k in Exclude<keyof T, TupleToUnion<U>>]: T[k]
} &
  { [k in TupleToUnion<U>]+?: T[k] }
