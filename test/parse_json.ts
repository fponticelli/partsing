import { regexp, match, TextParser, optionalWhitespace, TextSource } from '../src/text_parser'
import { alt, lazy } from '../src/parser'
import { JSONValue, JSONArray, JSONObject, JSONPrimitive } from './json_value'

const jsonTrue = match('true').result(true)
const jsonFalse = match('false').result(false)
  
const jsonNumber = regexp(/^-?(0|[1-9]\d*)([.]\d+)?([eE][+-]?\d+)?/)
  .map(Number)
  .as('number')

const jsonString = regexp(/^"((?:\\.|.)*?)"/, 1)
  .as('quoted string')
const jsonNull = match('null').result(null)
const jsonBoolean = jsonTrue.or(jsonFalse)

export const parseJson: TextParser<JSONValue> = lazy(() =>
  alt(
    jsonNumber,
    jsonNull,
    jsonBoolean,
    jsonString,
    jsonArray,
    jsonObject
  ))

const token = <T>(parser: TextParser<T>) => parser.skip(optionalWhitespace())
const commaSeparated = <T>(parser: TextParser<T>) => parser.separatedBy(token(match(',')))
const lCurly = token(match('{'))
const rCurly = token(match('}'))
const lSquare = token(match('['))
const rSquare = token(match(']'))
const comma = token(match(','))
const colon = token(match(':'))

const jsonArray: TextParser<JSONArray> = lSquare.then(commaSeparated(parseJson)).skip(rSquare)

const pair = jsonString.skip(colon).join(parseJson)
const jsonObject: TextParser<JSONObject> = lCurly.then(commaSeparated(pair)).skip(rCurly)
  .map((res: [string, JSONValue][]) => {
    return res.reduce(
      (acc: {}, pair: [string, JSONValue]) => {
        return {...acc, [pair[0]]: pair[1]}
      },
      {}
    )
})