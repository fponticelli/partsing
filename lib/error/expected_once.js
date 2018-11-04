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
var entity_1 = require("./entity");
var ExpectedOnce = /** @class */ (function (_super) {
    __extends(ExpectedOnce, _super);
    function ExpectedOnce(entity) {
        var _this = _super.call(this) || this;
        _this.entity = entity;
        _this.kind = 'expected-once';
        return _this;
    }
    ExpectedOnce.prototype.toString = function () {
        return "expected a " + entity_1.pluralize(this.entity, 1);
    };
    return ExpectedOnce;
}(decode_error_base_1.DecodeErrorBase));
exports.ExpectedOnce = ExpectedOnce;
//# sourceMappingURL=expected_once.js.map