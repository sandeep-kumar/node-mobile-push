var events = require("events");
var util = require("util");

function ExponentialBackOff() {
    this._timer = null;
    this._nextInterval = 1;
    this._started = false;

    events.EventEmitter.call(this);
}

util.inherits(ExponentialBackOff, events.EventEmitter);

ExponentialBackOff.prototype._setTimer = function () {
    return setTimeout(function () {
        this.emit("work", this._nextInterval);
        this._nextInterval *= 2;
        this.timer = this._setTimer();
    }.bind(this), this._nextInterval * 1000);
};

ExponentialBackOff.prototype.start = function () {
    if (this._started) return;
    this._started = true;
    this._timer = this._setTimer();
};

ExponentialBackOff.prototype.stop = function () {
    if (!this._started) {
        this.emit("error", "Timer not started");
    }
    clearTimeout(this.timer);
};

exports.ExponentialBackOff = ExponentialBackOff;