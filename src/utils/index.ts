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
 * Pattern to recognize if a field name is in a format that doesn't require quotes.
 */
export const isToken = /^[a-z$_]+$/i

/**
 * Adds double quotes to a string if it is not a simple sequence of
 * alpha-numeric characters.
 */
export const autoQuote = (value: string) => {
  if (isToken.test(value)) {
    return value
  } else {
    const t = value.replace('"', '\\"')
    return `"${t}"`
  }
}

/**
 * Pretty prints a `ValueInput.path` value.
 */
export const pathToString = (path: (string | number)[]): string => {
  return path.reduce((acc: string, curr: string | number) => {
    if (typeof curr === 'number') {
      return `${acc}[${curr}]`
    } else if (isToken.test(curr)) {
      return acc.length === 0 ? curr : `${acc}.${curr}`
    } else {
      const t = curr.replace('"', '\\"')
      return `${acc}["${t}"]`
    }
  }, '')
}

/**
 * Tries to convert any value into a human readable string.
 */
export function valueToString(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map(valueToString).join(',')}]`
  } else if (value === null) {
    return 'null'
  } else if (typeof value === 'object') {
    const pairs = Object.keys(value).map((k: string): string => `${autoQuote(k)}:${valueToString(value[k])}`)
    const prefix = (
        value.constructor &&
        value.constructor.name &&
        value.constructor.name !== 'Object' &&
        `${value.constructor.name} `
      ) || ''
    return `${prefix}{${pairs.join(',')}}`
  } else if (typeof value === 'string') {
    return autoQuote(value)
  } else {
    return String(value)
  }
}

/**
 * Utility function to generate a comma separate list of values where the last
 * one is concatenated by `or`.
 */
export const concatOr = (values: string[]) => {
  const length = values.length
  if (length === 0) {
    return '<empty>'
  } else if (length <= 2) {
    return values.join(' or ')
  } else {
    const last = values[length - 1]
    const head = values.slice(0, length - 1)
    return `${head.join(', ')} or ${last}`
  }
}
