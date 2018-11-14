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

export enum Entity {
  CHARACTER = 'character',
  PREDICATE = 'predicate',
  LETTER = 'letter',
  UPPERCASE_LETTER = 'uppercase letter',
  LOWER_CASE_LETTER = 'lowercase letter',
  DIGIT = 'digit',
  WHITESPACE = 'whitespace'
}

export const pluralize = (entity: Entity, qt: number) => {
  if (qt === 1)
    return String(entity)
  switch (entity) {
    case Entity.CHARACTER: return 'characters'
    case Entity.PREDICATE: return 'predicates'
    case Entity.LETTER: return 'letters'
    case Entity.UPPERCASE_LETTER: return 'uppercase letters'
    case Entity.LOWER_CASE_LETTER: return 'lowercase letters'
    case Entity.DIGIT: return 'digits'
    case Entity.WHITESPACE: return 'whitespaces'
    default: throw new Error('unreacheable code')
  }
}
