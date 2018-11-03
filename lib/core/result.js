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
var ParseResultBase = /** @class */ (function () {
    function ParseResultBase(input) {
        this.input = input;
    }
    return ParseResultBase;
}());
var ParseSuccess = /** @class */ (function (_super) {
    __extends(ParseSuccess, _super);
    function ParseSuccess(input, value) {
        var _this = _super.call(this, input) || this;
        _this.value = value;
        _this.kind = 'parse-success';
        return _this;
    }
    ParseSuccess.prototype.match = function (o) {
        return o.success(this);
    };
    ParseSuccess.prototype.flatMap = function (f) {
        return f(this.value);
    };
    ParseSuccess.prototype.map = function (f) {
        var _this = this;
        return this.flatMap(function (v) { return new ParseSuccess(_this.input, f(v)); });
    };
    ParseSuccess.prototype.flatMapError = function (f) {
        return new ParseSuccess(this.input, this.value);
    };
    ParseSuccess.prototype.mapError = function (f) {
        return new ParseSuccess(this.input, this.value);
    };
    ParseSuccess.prototype.isSuccess = function () {
        return true;
    };
    ParseSuccess.prototype.isFailure = function () {
        return false;
    };
    ParseSuccess.prototype.getUnsafeSuccess = function () {
        return this.value;
    };
    ParseSuccess.prototype.getUnsafeFailure = function () {
        throw new Error('can\'t get failure from success');
    };
    ParseSuccess.prototype.toString = function () {
        return "ParseSuccess<" + JSON.stringify(this.value) + ">: " + JSON.stringify(this.input);
    };
    return ParseSuccess;
}(ParseResultBase));
exports.ParseSuccess = ParseSuccess;
var ParseFailure = /** @class */ (function (_super) {
    __extends(ParseFailure, _super);
    function ParseFailure(input, failure) {
        var _this = _super.call(this, input) || this;
        _this.failure = failure;
        _this.kind = 'parse-failure';
        return _this;
    }
    ParseFailure.prototype.match = function (o) {
        return o.failure(this);
    };
    ParseFailure.prototype.flatMap = function (f) {
        return new ParseFailure(this.input, this.failure);
    };
    ParseFailure.prototype.map = function (f) {
        return new ParseFailure(this.input, this.failure);
    };
    ParseFailure.prototype.flatMapError = function (f) {
        return f(this.failure);
    };
    ParseFailure.prototype.mapError = function (f) {
        var _this = this;
        return this.flatMapError(function (e) { return new ParseFailure(_this.input, f(e)); });
    };
    ParseFailure.prototype.isSuccess = function () {
        return false;
    };
    ParseFailure.prototype.isFailure = function () {
        return true;
    };
    ParseFailure.prototype.getUnsafeSuccess = function () {
        throw new Error('can\'t get success from failure');
    };
    ParseFailure.prototype.getUnsafeFailure = function () {
        return this.failure;
    };
    ParseFailure.prototype.toString = function () {
        return "ParseFailure<" + JSON.stringify(this.failure) + ">: " + JSON.stringify(this.input);
    };
    return ParseFailure;
}(ParseResultBase));
exports.ParseFailure = ParseFailure;
exports.ParseResult = {
    success: function (input, result) {
        return new ParseSuccess(input, result);
    },
    failure: function (input, failure) {
        return new ParseFailure(input, failure);
    }
};
//# sourceMappingURL=result.js.map