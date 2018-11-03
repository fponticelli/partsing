import { Decoder } from '../core/decoder'
import { DecodeResult } from '../core/result'
import { TupleToUnion } from '../core/type_level'

export interface ValueInput {
  readonly input: any
  readonly path: (string | number)[]
}

export type ValueDecoder<T> = Decoder<ValueInput, T, string>

const make = <T>(f: (input: ValueInput) => DecodeResult<ValueInput, T, string>): ValueDecoder<T> =>
  new Decoder<ValueInput, T, string>(f)

export const decodeValue = <T>(decoder: ValueDecoder<T>, input: any): DecodeResult<ValueInput, T, string> =>
  decoder.run({ input, path: []})

export const testValue = <T>(f: (input: T) => boolean, expected: string) => make<T>(input => 
  f(input.input) ?  
    DecodeResult.success(input, input.input) :
    DecodeResult.failure(input, `expected ${expected} but got ${input.input}`)
)

export const testType = <T>(expected: string) => make<T>(input =>
  typeof input.input === expected ?
    DecodeResult.success(input, input.input) :
    DecodeResult.failure(input, `expected ${expected} but got ${typeof input.input}`)
)

export const nullableValue = <T>(decoder: ValueDecoder<T>) => decoder.or(nullValue)
export const undefineableValue = <T>(decoder: ValueDecoder<T>) => decoder.or(undefinedValue)
export const optionalValue = <T>(decoder: ValueDecoder<T>) => decoder.or(undefinedValue).or(nullValue)

export const anyValue = make<any>(input => DecodeResult.success(input, input.input))
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
export const arrayValue = <T>(decoder: ValueDecoder<T>) => 
  anyArrayValue.flatMap((values: any[]) =>
    make<T[]>((input: ValueInput) => {
      const length = values.length
      const buff = new Array(length)
      for (let i = 0; i < length; i++) {
        let s = { input: values[i], path: input.path.concat([i]) }
        let r = decoder.run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return DecodeResult.failure(r.input, r.failure)
        }
      }
      return DecodeResult.success(input, buff)
    })
  )

export const tupleValue = <U extends any[]>(...decoders: { [k in keyof U]: ValueDecoder<U[k]>}) => 
  anyArrayValue.flatMap((values: any[]) =>
    make<U>((input: ValueInput) => {
      const length = values.length
      const buff = new Array(length) as U
      for (let i = 0; i < length; i++) {
        let s = { input: values[i], path: input.path.concat([i]) }
        let r = decoders[i].run(s)
        if (r.isSuccess()) {
          buff[i] = r.value
        } else {
          return DecodeResult.failure(r.input, r.failure)
        }
      }
      return DecodeResult.success(input, buff)
    })
  )

const testObject = testType<{}>('object')

export const objectValue = <T, K extends keyof T>(
    fieldDecoders: { [k in keyof T]: ValueDecoder<T[k]> },
    ...optionalFields: K[]
  ): ValueDecoder<
    { [k in Exclude<keyof T, TupleToUnion<typeof optionalFields>>]: T[k] } &
    { [k in TupleToUnion<typeof optionalFields>]+?: T[k] }
  > => {
    return testObject.flatMap((o: any) => {
      return make(input => {
        const mandatoryFields = Object.keys(fieldDecoders).filter(f => optionalFields.indexOf(f as K) < 0)
        const buff = {} as any
        for (let field of mandatoryFields) {
          if (o.hasOwnProperty(field)) {
            const s = { input: o[field], path: input.path.concat([field]) }
            const result = fieldDecoders[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return DecodeResult.failure(result.input, result.failure)
            }
          } else {
            return DecodeResult.failure(input, `object doesn't have mandatory field "${field}"`)
          }
        }
        for (let field of optionalFields) {
          if (o.hasOwnProperty(field)) {
            const s = { input: o[field], path: input.path.concat([field as never]) }
            const result = fieldDecoders[field as K].run(s)
            if (result.isSuccess()) {
              buff[field] = result.value
            } else {
              return DecodeResult.failure(result.input, result.failure)
            }
          }
        }
        return DecodeResult.success(input, buff as never)
      })
    })
  }