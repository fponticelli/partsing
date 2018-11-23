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

import { ValueInput } from '../../src/value/input'
import { Decoder, oneOf } from '../../src/core/decoder'
import { DecodeError } from '../../src/error'
import { decodeText, eoi, match, matchInsensitive, optionalWhitespace, regexp } from '../../src/text'
import { TextInput } from '../../src/text/input'
import { decodeValue, literalValue, numberValue, objectValue, stringValue } from '../../src/value'

class RGB {
  constructor(readonly rgb: number) {}
  toString() {
    let s = this.rgb.toString(16)
    while (s.length < 6) s = `0${s}`
    return `#${s}`
  }
}

class Grey {
  constructor(readonly value: number) {}
  toString() {
    return `grey ${this.value}`
  }
}

class HSL {
  constructor(readonly hue: number, readonly saturation: number, readonly lightness: number) {}
  toString() {
    return `hsl(${this.hue},${this.saturation},${this.lightness})`
  }
}

type Color = RGB | Grey | HSL

// Hue in HSL is generally measured as an angle, not a ratio
const ratioDecoder = regexp(/0[.]\d+/y).map(Number)
const rgbDecoder = regexp(/[#]([0-9a-f]{6})/iy, 1)
  .map(v => parseInt(v, 16))
  .map(v => new RGB(v))
const greyDecoder = matchInsensitive('grey')
  .or(matchInsensitive('gray'))
  .skipNext(optionalWhitespace)
  .pickNext(ratioDecoder)
  .map(v => new Grey(v))
const hslDecoder = matchInsensitive('hsl(')
  .pickNext(ratioDecoder.separatedByTimes(match(','), 3).map(v => new HSL(v[0], v[1], v[2])))
  .skipNext(match(')'))

const colorTextDecoder = decodeText(
  // the `eoi` at the end, makes sure that there is nothing left to decode
  oneOf<TextInput, Color[], DecodeError>(rgbDecoder, greyDecoder, hslDecoder).skipNext(eoi)
)

describe('text color decoder', () => {
  it('decodes color from string', () => {
    expect(
      colorTextDecoder('#003355')
        .getUnsafeSuccess()
        .toString()
    ).toEqual('#003355')
    expect(
      colorTextDecoder('gray 0.3')
        .getUnsafeSuccess()
        .toString()
    ).toEqual('grey 0.3')
    expect(
      colorTextDecoder('gray0.2')
        .getUnsafeSuccess()
        .toString()
    ).toEqual('grey 0.2')
    expect(
      colorTextDecoder('HSL(0.1,0.2,0.3)')
        .getUnsafeSuccess()
        .toString()
    ).toEqual('hsl(0.1,0.2,0.3)')
  })
})

const ratioValue = numberValue.test(v => v >= 0 && v <= 1, DecodeError.expectedWithinRange('0', '1'))

// reuse the rgbDecoder defined above to validate and trasform the string value into an RGB instance
// example: "#003366"
const rgbValue = stringValue.sub(rgbDecoder, input => ({ input, index: 0 }), v => v)

// example: { "grey": 0.5 }
const greyValue = objectValue(
  { grey: ratioValue },
  [] // the empty array means that no fields are optional
).map(v => new Grey(v.grey))

// example: { "kind": "hsl", "h": 0.2, "s": 0.5, "l": 0.8 }
const hslValue = objectValue(
  {
    kind: literalValue('hsl'),
    h: ratioValue,
    s: ratioValue,
    l: ratioValue
  },
  []
).map(v => new HSL(v.h, v.s, v.l))

const colorValueDecoder = decodeValue(oneOf<ValueInput, Color[], DecodeError>(rgbValue, greyValue, hslValue))

describe('value color decoder', () => {
  it('decodes color from value', () => {
    expect(
      colorValueDecoder('#003355')
        .getUnsafeSuccess()
        .toString()
    ).toEqual('#003355')
    expect(
      colorValueDecoder({ grey: 0.5 })
        .getUnsafeSuccess()
        .toString()
    ).toEqual('grey 0.5')
    expect(
      colorValueDecoder({ kind: 'hsl', h: 0.2, s: 0.5, l: 0.8 })
        .getUnsafeSuccess()
        .toString()
    ).toEqual('hsl(0.2,0.5,0.8)')
  })
})
