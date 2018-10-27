import { regexp, match, TextParser, optionalWhitespace, TextSource } from '../src/text_parser'
import { oneOf, lazy } from '../src/parser'
import { JSONValue, JSONArray, JSONObject, JSONPrimitive } from './json_value'

const jsonTrue = match('true').withResult(true)
const jsonFalse = match('false').withResult(false)
  
const jsonNumber = regexp(/^-?(0|[1-9]\d*)([.]\d+)?([eE][+-]?\d+)?/)
  .map(Number)
  .withFailure('number')

const jsonString = regexp(/^"((?:\\.|.)*?)"/, 1)
  .withFailure('quoted string')
const jsonNull = match('null').withResult(null)
const jsonBoolean = jsonTrue.or(jsonFalse)

export const parseJson: TextParser<JSONValue> = lazy(() =>
  oneOf(
    jsonNumber,
    jsonNull,
    jsonBoolean,
    jsonString,
    jsonArray,
    jsonObject
  ))

const token = <T>(parser: TextParser<T>) => parser.skipNext(optionalWhitespace())
const commaSeparated = <T>(parser: TextParser<T>) => parser.separatedBy(token(match(',')))
const lCurly = token(match('{'))
const rCurly = token(match('}'))
const lSquare = token(match('['))
const rSquare = token(match(']'))
const comma = token(match(','))
const colon = token(match(':'))

const jsonArray: TextParser<JSONArray> = lSquare.pickNext(commaSeparated(parseJson)).skipNext(rSquare)

const pair = jsonString.skipNext(colon).join(parseJson)
const jsonObject: TextParser<JSONObject> = lCurly.pickNext(commaSeparated(pair)).skipNext(rCurly)
  .map((res: [string, JSONValue][]) => {
    return res.reduce(
      (acc: {}, pair: [string, JSONValue]) => {
        return {...acc, [pair[0]]: pair[1]}
      },
      {}
    )
})