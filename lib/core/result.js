"use strict";
// Copyright 2018 Google LLC
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
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     https://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var DecodeResultBase = /** @class */ (function () {
    function DecodeResultBase(input) {
        this.input = input;
    }
    return DecodeResultBase;
}());
var DecodeSuccess = /** @class */ (function (_super) {
    __extends(DecodeSuccess, _super);
    function DecodeSuccess(input, value) {
        var _this = _super.call(this, input) || this;
        _this.value = value;
        _this.kind = 'decode-success';
        return _this;
    }
    DecodeSuccess.prototype.match = function (o) {
        return o.success(this);
    };
    DecodeSuccess.prototype.flatMap = function (f) {
        return f(this.value);
    };
    DecodeSuccess.prototype.map = function (f) {
        var _this = this;
        return this.flatMap(function (v) { return new DecodeSuccess(_this.input, f(v)); });
    };
    DecodeSuccess.prototype.flatMapError = function (f) {
        return new DecodeSuccess(this.input, this.value);
    };
    DecodeSuccess.prototype.mapError = function (f) {
        return new DecodeSuccess(this.input, this.value);
    };
    DecodeSuccess.prototype.mapInput = function (f) {
        return new DecodeSuccess(f(this.input), this.value);
    };
    DecodeSuccess.prototype.isSuccess = function () {
        return true;
    };
    DecodeSuccess.prototype.isFailure = function () {
        return false;
    };
    DecodeSuccess.prototype.getUnsafeSuccess = function () {
        return this.value;
    };
    DecodeSuccess.prototype.getUnsafeFailure = function () {
        throw new Error('can\'t get failure from success');
    };
    DecodeSuccess.prototype.toString = function () {
        return "DecodeSuccess<" + JSON.stringify(this.value) + ">: " + JSON.stringify(this.input);
    };
    return DecodeSuccess;
}(DecodeResultBase));
exports.DecodeSuccess = DecodeSuccess;
var DecodeFailure = /** @class */ (function (_super) {
    __extends(DecodeFailure, _super);
    function DecodeFailure(input, failure) {
        var _this = _super.call(this, input) || this;
        _this.failure = failure;
        _this.kind = 'decode-failure';
        return _this;
    }
    DecodeFailure.prototype.match = function (o) {
        return o.failure(this);
    };
    DecodeFailure.prototype.flatMap = function (f) {
        return new DecodeFailure(this.input, this.failure);
    };
    DecodeFailure.prototype.map = function (f) {
        return new DecodeFailure(this.input, this.failure);
    };
    DecodeFailure.prototype.flatMapError = function (f) {
        return f(this.failure);
    };
    DecodeFailure.prototype.mapError = function (f) {
        var _this = this;
        return this.flatMapError(function (e) { return new DecodeFailure(_this.input, f(e)); });
    };
    DecodeFailure.prototype.mapInput = function (f) {
        return new DecodeFailure(f(this.input), this.failure);
    };
    DecodeFailure.prototype.isSuccess = function () {
        return false;
    };
    DecodeFailure.prototype.isFailure = function () {
        return true;
    };
    DecodeFailure.prototype.getUnsafeSuccess = function () {
        throw new Error('can\'t get success from failure');
    };
    DecodeFailure.prototype.getUnsafeFailure = function () {
        return this.failure;
    };
    DecodeFailure.prototype.toString = function () {
        return "DecodeFailure<" + JSON.stringify(this.failure) + ">: " + JSON.stringify(this.input);
    };
    return DecodeFailure;
}(DecodeResultBase));
exports.DecodeFailure = DecodeFailure;
exports.DecodeResult = {
    success: function (input, result) {
        return new DecodeSuccess(input, result);
    },
    failure: function (input, failure) {
        return new DecodeFailure(input, failure);
    }
};
//# sourceMappingURL=result.js.map