import { regexp, matchInsensitive, optionalWhitespace, match, decodeText, eoi } from '../../src/text/index'
import { oneOf } from '../../src/core/decoder'
import { TextInput } from '../../src/text/input'
import { DecodeError } from '../../src/error'

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

const ratioDecoder = regexp(/0[.]\d+/y).map(Number)
const rgbDecoder   = regexp(/[#]([0-9a-f]{6})/iy, 1)
                       .map(v => parseInt(v, 16))
                       .map(v => new RGB(v))
const greyDecoder  = matchInsensitive('grey').or(matchInsensitive('gray'))
                       .skipNext(optionalWhitespace)
                       .pickNext(ratioDecoder)
                       .map(v => new Grey(v))
const hslDecoder   = matchInsensitive('hsl(')
                       .pickNext(
                         ratioDecoder
                           .separatedByTimes(match(','), 3)
                           .map(v => new HSL(v[0], v[1], v[2]))
                       )
                       .skipNext(match(')'))

const colorDecoder = decodeText<Color>(
    oneOf<TextInput, [RGB, Grey, HSL], DecodeError>(
      rgbDecoder,
      greyDecoder,
      hslDecoder
    ).skipNext(eoi)
  )

describe('color decoder', () => {
  it('decodes color', () => {
    expect(colorDecoder('#003355').getUnsafeSuccess().toString()).toEqual('#003355')
    expect(colorDecoder('gray 0.3').getUnsafeSuccess().toString()).toEqual('grey 0.3')
    expect(colorDecoder('gray0.2').getUnsafeSuccess().toString()).toEqual('grey 0.2')
    expect(colorDecoder('HSL(0.1,0.2,0.3)').getUnsafeSuccess().toString()).toEqual('hsl(0.1,0.2,0.3)')
  })
})