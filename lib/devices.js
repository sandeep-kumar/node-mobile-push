var util = require("util");
var events = require("events");
var log = require("./log.js").getLogger("[DEVICE]");

var Device = function (/* app name */ name, /* device type */ type) {
    events.EventEmitter.call(this);
    this.name = name;
    this.type = type;
    this._registeredDevices = { };
};

util.inherits(Device, events.EventEmitter);

Device.prototype.register = function (/* device_id */ device_id, /*pushUri*/ push_URI, /*callback URl*/ callback_URL) {
    if (this._registeredDevices[device_id]) {
        log.info ("device: %s already registered", device_id);
        registeredDevices[device_id].last_registered = new Date();
        return false;
    }

    this._registeredDevices[device_id] = {
        device_id: device_id
        , push_sent: 0
        , push_failed: 0
        , last_registered: new Date()
		, push_URI: push_URI || ""
		, callback_URL: callback_URL || ""
    };

    return true;
};

Device.prototype.push = function (/* device_id */ device_id, /*payload */ payload) {
    if (!this._registeredDevices[device_id]) 
        return null;
     ++this._registeredDevices[device_id].push_sent;
	return this._registeredDevices[device_id];
};

Device.prototype.unregister = function (/* device_id */ device_id) {
    if (!this._registeredDevices[device_id]) {
        log.warn ("trying to unregister not registered device: %s", device_id);
        return;
    }
    delete this._registeredDevices[device_id];
};

module.exports = Device;
