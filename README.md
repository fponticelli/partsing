# ParTSing

*ParTSing* is a decoder combinator library. You can use it to build parsers/decoders from string or really any input values.

If you want full control over what to decode your should start from `partsing/core/decoder`. It provides 3 types parameters

* `In` for the input. Remember that you will need to decode one portion of your input at the time and your input probably needs to track somehow the current postion.
* `Out` it's the type of the value if successfully decoded.
* `Err` it's the type of the failure returned when the parser fails.

The library provides two additional set of utility functions to decode `string` values (`partsing/text`) and native JS values (`partsing/value`).

## Decoder Error

If you adopt the generic `Decoder` directly, you can define the shape of your error. The library provides a `DecoderError` type that should fit most decoding needs. The type of errors available are defined in `partsing/error`.

`DecoderError` provides a simple method to debug the result of the decoding (`toString`) but still leaves the flexibility to give granular control on the representation of the error.

Both [Text Decoding] and [Value Decoding] use `DecodeError`.

## Text Decoding

To be able to keep track of the position of the decoding within a `string`, Text Decoding uses `TextInput` to track both the entire text `input` and the current `index`.

The `decodeText` function simplifies the inputs and outputs of decoding text. It takes a text decoder (`Decoder<TextInput, T, DecoderError>`) and return a function that takes a string input and returns a `DecodeResult<string, T, string>` (where input and error are of type `string`).

If you intend to write your own regular expressions decoder functions, consider using the `y` (`sticky`) flag. When used, there is no need to reallocate slices of the input string saving memory and CPU cycles. The `sticky` flag is not available for all implementations of JS.

## Value Decoding

To be able to keep track of the position of the decoding within `any` value, Value Decoding uses `ValueInput` to track both the `input` value and the current position within it using a `path`. `path` is an array of either `string` (object field name) or `number` (array/tuple index position).

The `decodeValue` function simplifies the inputs and outputs of decoding values. It takes a value decoder (`Decoder<ValueInput, T, DecoderError>`) and return a function that takes `any` and returns a `DecodeResult<any, T, string>` (where input is of type `any` and error is of type `string`).

## Example

A simple decoder combinator to parse color values into class instances. 

```typescript
class RGB {
  constructor(readonly rgb: number) {}
}

class Grey {
  constructor(readonly value: number) {}
}

class HSL {
  constructor(readonly hue: number, readonly saturation: number, readonly lightness: number) {}
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
    ).skipNext(eoi) // make sure that there is nothing left to decode
  )

// all results are wrapped in a DecodeSuccess
// colorDecoder('#003355')          == new RGB(0x003355)
// colorDecoder('gray 0.3')         == new Grey(0.3)
// colorDecoder('gray0.2')          == new Grey(0.2)
// colorDecoder('HSL(0.1,0.2,0.3)') == new HSL(0.1,0.2,0.3)
```