import { regexp, match, TextParser, optionalWhitespace, parseText } from '../../src/text'
import { oneOf, lazy } from '../../src/core/parser'
import { JSONValue, JSONArray, JSONObject } from './json_value'
import { ParseResult } from '../../src/core/result'
import { DecodeError } from '../../src/error'
import { TextInput } from '../../src/text/input'

const jsonTrue = match('true').withResult(true)
const jsonFalse = match('false').withResult(false)
  
const jsonNumber = regexp(/-?(0|[1-9]\d*)([.]\d+)?([eE][+-]?\d+)?/y)
  .map(Number)
  .withFailure(DecodeError.custom('expected number'))

// this is incomplete as it doesn't convert escaped chars or unicode values
const jsonString = regexp(/"((:?\\"|[^"])*)"/y, 1)
  .withFailure(DecodeError.custom('expected quoted string'))
const jsonNull = match('null').withResult(null)
const jsonBoolean = jsonTrue.or(jsonFalse)

const jsonValue: TextParser<JSONValue> = lazy(() =>
  oneOf(
    jsonNumber,
    jsonNull,
    jsonBoolean,
    jsonString,
    jsonArray,
    jsonObject
  ))

const token = <T>(parser: TextParser<T>) => parser.skipNext(optionalWhitespace)
const commaSeparated = <T>(parser: TextParser<T>) => parser.separatedBy(token(match(',')))
const lCurly = token(match('{'))
const rCurly = token(match('}'))
const lSquare = token(match('['))
const rSquare = token(match(']'))
const comma = token(match(','))
const colon = token(match(':'))

const jsonArray: TextParser<JSONArray> = lSquare.pickNext(commaSeparated(jsonValue)).skipNext(rSquare)

const pair = jsonString.skipNext(colon).join(jsonValue)
const jsonObject: TextParser<JSONObject> = lCurly.pickNext(commaSeparated(pair)).skipNext(rCurly)
  .map((res: [string, JSONValue][]) => {
    return res.reduce(
      (acc: {}, pair: [string, JSONValue]) => {
        return {...acc, [pair[0]]: pair[1]}
      },
      {}
    )
})

export const parseJson = (input: string): ParseResult<TextInput, JSONValue, DecodeError> => parseText(jsonValue, input)