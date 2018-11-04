import { lazy, oneOf } from '../../src/core/decoder'
import { DecodeResult } from '../../src/core/result'
import { DecodeError } from '../../src/error'
import { decodeText, match, optionalWhitespace, regexp, TextDecoder } from '../../src/text'
import { JSONArray, JSONObject, JSONValue } from './json_value'

const jsonTrue = match('true').withResult(true)
const jsonFalse = match('false').withResult(false)
  
const jsonNumber = regexp(/-?(0|[1-9]\d*)([.]\d+)?([eE][+-]?\d+)?/y)
  .map(Number)
  .withFailure(DecodeError.custom('expected number'))

// this is incomplete as it doesn't convert escaped chars or unicode values
const jsonString = regexp(/"((:?\\"|[^"])*)"/y, 1)
  .withFailure(DecodeError.custom('expected quoted string'))
const jsonNull = match('null').withResult(null)
const jsonBoolean = jsonTrue.or(DecodeError.combine, jsonFalse)

const jsonValue: TextDecoder<JSONValue> = lazy(() =>
  oneOf(
    DecodeError.combine,
    jsonNumber,
    jsonNull,
    jsonBoolean,
    jsonString,
    jsonArray,
    jsonObject
  ))

const token = <T>(parser: TextDecoder<T>) => parser.skipNext(optionalWhitespace)
const commaSeparated = <T>(parser: TextDecoder<T>) => parser.separatedBy(token(match(',')))
const lCurly = token(match('{'))
const rCurly = token(match('}'))
const lSquare = token(match('['))
const rSquare = token(match(']'))
const comma = token(match(','))
const colon = token(match(':'))

const jsonArray: TextDecoder<JSONArray> = lSquare.pickNext(commaSeparated(jsonValue)).skipNext(rSquare)

const pair = jsonString.skipNext(colon).join(jsonValue)
const jsonObject: TextDecoder<JSONObject> = lCurly.pickNext(commaSeparated(pair)).skipNext(rCurly)
  .map((res: [string, JSONValue][]) => {
    return res.reduce(
      (acc: {}, pair: [string, JSONValue]) => {
        return {...acc, [pair[0]]: pair[1]}
      },
      {}
    )
})

export const decodeJson = (input: string): DecodeResult<string, JSONValue, string> => decodeText(jsonValue)(input)