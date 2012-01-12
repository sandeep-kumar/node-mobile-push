var events = require("events");
var util = require("util");

function Timer () {
    this._timeout = 0;
    this._started = false;
    this._timer = null;
    this._counter = 0;

    events.EventEmitter.call(this);
}

util.inherits(Timer, events.EventEmitter);

Timer.prototype.start = function () {
    if (this._started) throw new Error ("Timer already started");
    this._started = true;
    this._setTimer();
};

Timer.prototype.stop = function () {
    if (!this._started) throw new Error ("Timer already started");
    this._timeout = 0;
    this._started = false;
    clearTimeout(this._timer);
};

Timer.prototype._setTimer = function () {
    return setTimeout(function () {
        ++this._counter;
        this._timeout = this.nextInterval(this._timeout);
        this.emit("work", this._counter, this._timeout);
        this.timer = this._setTimer();
    }.bind(this), this.nextInterval(this._timeout));
};

util.inherits(ExponentialBackOff, Timer);
function ExponentialBackOff(start) {
    start = start || 0;
    Timer.call (this);
    this.nextInterval = function (x) {
        if (x == 0) return start || 1;
        else return x * 2;
    };
}

util.inherits(Uniform, Timer);
function Uniform (constant, start) {
    if (!constant) {
        throw new Error ("Interval not provided");
    }
    start = start || constant || 0;
    Timer.call(this);
    this.nextInterval = function (x) {
        if (x == 0) return start;
        return x + constant;
    }
}

exports.ExponentialBackOff = ExponentialBackOff;
exports.Uniform = Uniform;

