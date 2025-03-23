"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var JsonError = /** @class */ (function (_super) {
    __extends(JsonError, _super);
    function JsonError(_a) {
        var message = _a.message, status = _a.status, details = _a.details;
        var _this = _super.call(this, message) || this;
        _this.name = "JsonError";
        _this.status = status;
        _this.details = details;
        return _this;
    }
    return JsonError;
}(Error));
var LeakyBucket = /** @class */ (function () {
    function LeakyBucket(_a) {
        var refillRate = _a.refillRate, capacity = _a.capacity;
        this.tokens = capacity;
        this.refillRate = refillRate; // seconds
        this.capacity = capacity;
        this.lastTimestamp = Date.now();
    }
    LeakyBucket.prototype.refillBucket = function () {
        this.tokens = this.capacity;
    };
    LeakyBucket.prototype.decrement = function () {
        this.tokens -= 1;
    };
    LeakyBucket.prototype.hasTokens = function () {
        return this.tokens > 0;
    };
    LeakyBucket.prototype.canRefillBucket = function () {
        var timeNow = Date.now();
        var timeDelta = (timeNow - this.lastTimestamp) / 1000;
        if (timeDelta >= this.refillRate) {
            return true;
        }
        return false;
    };
    LeakyBucket.prototype.allow = function () {
        if (this.canRefillBucket()) {
            this.refillBucket();
            this.decrement();
            this.lastTimestamp = Date.now();
            return true;
        }
        if (this.hasTokens()) {
            this.decrement();
            return true;
        }
        return false;
    };
    return LeakyBucket;
}());
var RateLimiter = /** @class */ (function () {
    function RateLimiter() {
        this.buckets = new Map();
    }
    RateLimiter.prototype.allow = function (request) {
        var userId = request["userId"];
        if (userId) {
            var userBucket = this.buckets.get(userId);
            if (!userBucket) {
                this.buckets.set(userId, new LeakyBucket({ refillRate: 60000, capacity: 5 }));
                userBucket = this.buckets.get(userId);
            }
            if (userBucket) {
                var permitUser = userBucket.allow();
                if (!permitUser) {
                    throw new JsonError({
                        message: "User not allowed to make request, API limit has been reached",
                        status: 429,
                    });
                }
                return;
            }
            throw new JsonError({
                message: "Internal server error, unable to retrieve user information",
                status: 500,
            });
        }
        throw new JsonError({
            message: "Unable to retrieve user information from request",
            status: 400,
        });
    };
    return RateLimiter;
}());
exports.default = RateLimiter;
