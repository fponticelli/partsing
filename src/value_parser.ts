import { Parser } from './parser'
import { ParseResult } from './parse_result'
import { TupleToUnion } from './type_level'

export interface ValueSource {
  readonly source: any
  readonly path: (string | number)[]
}

export type ValueParser<T> = Parser<T, string, ValueSource>

const make = <T>(f: (source: ValueSource) => ParseResult<T, string, ValueSource>): ValueParser<T> =>
  new Parser<T, string, ValueSource>(f)

export const parseValue = <T>(parser: ValueParser<T>, source: any): ParseResult<T, string, ValueSource> =>
  parser.run({ source, path: []})

export const testValue = <T>(f: (source: T) => boolean, expected: string) => make<T>(source => 
  f(source.source) ?  
    ParseResult.success(source, source.source) :
    ParseResult.failure(source, `expected ${expected} but got ${source.source}`)
)

export const testType = <T>(expected: string) => make<T>(source =>
  typeof source.source === expected ?
    ParseResult.success(source, source.source) :
    ParseResult.failure(source, `expected ${expected} but got ${typeof source.source}`)
)

export const nullableValue = <T>(parser: ValueParser<T>) => parser.or(nullValue)
export const undefineableValue = <T>(parser: ValueParser<T>) => parser.or(undefinedValue)
export const optionalValue = <T>(parser: ValueParser<T>) => parser.or(undefinedValue).or(nullValue)

export const anyValue = make<any>(source => ParseResult.success(source, source.source))
export const stringValue = testType<string>('string')
export const numberValue = testType<number>('number')
export const booleanValue = testType<boolean>('boolean')
export const undefinedValue = testType<undefined>('undefined')
export const nullValue = testValue<null>(v => v === null, 'null').withResult(null)
export const literalValue = <T>(value: T, eq: (a: T, b: T) => boolean = (a, b) => a === b) =>
  testValue((v: T) => eq(v, value), String(value)).withResult(value)

export const anyArrayValue = testValue<any[]>(Array.isArray, 'array')
export const arrayValue = <T>(parser: ValueParser<T>) => 
  anyArrayValue.flatMap((values: any[]) =>
    make<T[]>((source: ValueSource) => {
      const length = values.length
      const buff = new Array(length)
      for (let i = 0; i < length; i++) {
        let s = { source: values[i], path: source.path.concat([i]) }
        let r = parser.run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return ParseResult.failure(r.source, r.failure)
        }
      }
      return ParseResult.success(source, buff)
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
      return make(source => {
        const mandatoryFields = Object.keys(fieldParsers).filter(f => optionalFields.indexOf(f as K) >= 0)
        const buff = {} as any
        for (let field of mandatoryFields) {
          if (o.hasOwnProperty(field)) {
            const s = { source: o[field], path: source.path.concat([field]) }
            const result = fieldParsers[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return ParseResult.failure(result.source, result.failure)
            }
          } else {
            return ParseResult.failure(source, `object doesn't have mandatory field "${field}"`)
          }
        }
        for (let field of optionalFields) {
          if (o.hasOwnProperty(field)) {
            const s = { source: o[field], path: source.path.concat([field as never]) }
            const result = fieldParsers[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return ParseResult.failure(result.source, result.failure)
            }
          }
        }
        return ParseResult.success(source, buff as never)
      })
    })
  }