"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var decode_error_base_1 = require("./decode_error_base");
var CombineError = /** @class */ (function (_super) {
    __extends(CombineError, _super);
    function CombineError(errors) {
        var _this = _super.call(this) || this;
        _this.errors = errors;
        _this.kind = 'combine-error';
        return _this;
    }
    CombineError.prototype.toString = function () {
        var errors = this.errors
            .map(function (e) { return e.toString(); })
            .map(function (s) { return "  - " + s; })
            .join('\n');
        return "expected one of:\n" + errors;
    };
    return CombineError;
}(decode_error_base_1.DecodeErrorBase));
exports.CombineError = CombineError;
//# sourceMappingURL=combine_error.js.map