import { Parser } from './parser'
import { ParseResult } from './parse_result'
import { TupleToUnion } from './type_level'

export interface ValueInput {
  readonly input: any
  readonly path: (string | number)[]
}

export type ValueParser<T> = Parser<T, string, ValueInput>

const make = <T>(f: (input: ValueInput) => ParseResult<T, string, ValueInput>): ValueParser<T> =>
  new Parser<T, string, ValueInput>(f)

export const parseValue = <T>(parser: ValueParser<T>, input: any): ParseResult<T, string, ValueInput> =>
  parser.run({ input, path: []})

export const testValue = <T>(f: (input: T) => boolean, expected: string) => make<T>(input => 
  f(input.input) ?  
    ParseResult.success(input, input.input) :
    ParseResult.failure(input, `expected ${expected} but got ${input.input}`)
)

export const testType = <T>(expected: string) => make<T>(input =>
  typeof input.input === expected ?
    ParseResult.success(input, input.input) :
    ParseResult.failure(input, `expected ${expected} but got ${typeof input.input}`)
)

export const nullableValue = <T>(parser: ValueParser<T>) => parser.or(nullValue)
export const undefineableValue = <T>(parser: ValueParser<T>) => parser.or(undefinedValue)
export const optionalValue = <T>(parser: ValueParser<T>) => parser.or(undefinedValue).or(nullValue)

export const anyValue = make<any>(input => ParseResult.success(input, input.input))
export const stringValue = testType<string>('string')
export const numberValue = testType<number>('number')
export const integerValue = numberValue.test(Number.isInteger, 'expected integer')
export const safeIntegerValue = numberValue.test(Number.isSafeInteger, 'expected safe integer')
export const finiteNumberValue = numberValue.test(Number.isFinite, 'expected finite number')
export const booleanValue = testType<boolean>('boolean')
export const undefinedValue = testType<undefined>('undefined')
export const nullValue = testValue<null>(v => v === null, 'null').withResult(null)
export const literalValue = <T>(value: T, eq: (a: T, b: T) => boolean = (a, b) => a === b) =>
  testValue((v: T) => eq(v, value), String(value)).withResult(value)

export const anyArrayValue = testValue<any[]>(Array.isArray, 'array')
export const arrayValue = <T>(parser: ValueParser<T>) => 
  anyArrayValue.flatMap((values: any[]) =>
    make<T[]>((input: ValueInput) => {
      const length = values.length
      const buff = new Array(length)
      for (let i = 0; i < length; i++) {
        let s = { input: values[i], path: input.path.concat([i]) }
        let r = parser.run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return ParseResult.failure(r.input, r.failure)
        }
      }
      return ParseResult.success(input, buff)
    })
  )

export const tupleValue = <U extends any[]>(...parsers: { [k in keyof U]: ValueParser<U[k]>}) => 
  anyArrayValue.flatMap((values: any[]) =>
    make<U>((input: ValueInput) => {
      const length = values.length
      const buff = new Array(length) as U
      for (let i = 0; i < length; i++) {
        let s = { input: values[i], path: input.path.concat([i]) }
        let r = parsers[i].run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return ParseResult.failure(r.input, r.failure)
        }
      }
      return ParseResult.success(input, buff)
    })
  )

const testObject = testType<{}>('object')

export const objectValue = <T, K extends keyof T>(
    fieldParsers: { [k in keyof T]: ValueParser<T[k]> },
    ...optionalFields: K[]
  ): ValueParser<
    { [k in Exclude<keyof T, TupleToUnion<typeof optionalFields>>]: T[k] } &
    { [k in TupleToUnion<typeof optionalFields>]+?: T[k] }
  > => {
    return testObject.flatMap((o: any) => {
      return make(input => {
        const mandatoryFields = Object.keys(fieldParsers).filter(f => optionalFields.indexOf(f as K) < 0)
        const buff = {} as any
        for (let field of mandatoryFields) {
          if (o.hasOwnProperty(field)) {
            const s = { input: o[field], path: input.path.concat([field]) }
            const result = fieldParsers[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return ParseResult.failure(result.input, result.failure)
            }
          } else {
            return ParseResult.failure(input, `object doesn't have mandatory field "${field}"`)
          }
        }
        for (let field of optionalFields) {
          if (o.hasOwnProperty(field)) {
            const s = { input: o[field], path: input.path.concat([field as never]) }
            const result = fieldParsers[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return ParseResult.failure(result.input, result.failure)
            }
          }
        }
        return ParseResult.success(input, buff as never)
      })
    })
  }