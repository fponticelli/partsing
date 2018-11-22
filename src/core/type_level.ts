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
 * @module core
 */

export type TupleToUnion<T extends any[]> = T[number] | never

export type Output<T extends { _O: any }> = T['_O']
export type Input<T extends { _I: any }> = T['_I']
export type Error<T extends { _E: any }> = T['_E']

export type MarkOptionalFields<T, U extends any[], K extends keyof T = keyof T> = {
  [k in Exclude<keyof T, TupleToUnion<U>>]: T[k]
} &
  { [k in TupleToUnion<U>]+?: T[k] }
