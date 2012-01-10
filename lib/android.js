var util = require("util");
var https = require("https");
var events = require("events");
var queryString = require("querystring");

var pushUtils = require("./push-utils.js");
var log = require("./log.js").getLogger("[ANDROID]");

var config = {
    userName: "android@talk.to",
    password: "*h*wOOl2",
    pushUrl: "https://android.apis.google.com/c2dm/send",
    accountType: "HOSTED_OR_GOOGLE",
    service: "ac2dm",
    collapseKey: "collapse_key",
    clientLoginUrl: "https://www.google.com/accounts/ClientLogin"
};

var onCompleteBody = pushUtils.onCompleteBody;

function Android () {
    events.EventEmitter.call(this);
    this.userName = config.userName;
    this.password = config.password;
    this.pushUrl = config.pushUrl;
    this.service = config.service;
    this.accountType = config.accountType;
    this._getClientAuthToken();
};

util.inherits(Android, events.EventEmitter);

Android.prototype._on_clientAuth_response = function (statusCode, body) {
    var parsedRes = queryString.parse(body, "\n");
    if (statusCode !== 200) {
        log.error("Auth Error: %s %s", statusCode, parsedRes.Error);
        this.emit ("error", parsedRes.Error);
    } else {
        this._authToken = parsedRes.Auth;
        log.info ("Registerd token: %s", this._authToken);
        this.emit ("ready");
    }
};

Android.prototype._on_clientAuthReq_error = function (err) {
    log.error ("Client Auth Request Failure");
    log.error (err.toString());
    this.emit ("error", "Client Auth Request Failure");
};

Android.prototype._getClientAuthToken = function () {
    var options = {
        host: "www.google.com",
        path: "/accounts/ClientLogin",
        method: "POST"
    };

    var request = https.request(options);
    request.on ("response", onCompleteBody(this._on_clientAuth_response.bind(this)));
    request.on ("error", this._on_clientAuthReq_error.bind(this));
    request.setHeader("Content-type", "application/x-www-form-urlencoded");

    var authBody = queryString.stringify({
        accountType: this.accountType,
        Email: this.userName,
        Passwd: this.password,
        service: this.service
    });
    log.info ("Requesting ClientAuthToken");
    request.end(authBody);
};

Android.prototype._on_pushReq_error = function (registration_id, message) {
    
};

Android.prototype._on_push_response = function (registration_id, message) {
    return function (statusCode, body) {
        log 
    }
};


Android.prototype.tickle = function (registration_id) {
    this.push(registration_id, "");
};

Android.prototype.push = function (registration_id, message) {
    var options = {
        host: "android.apis.google.com",
        path: "/c2dm/send",
        method: "POST"
    };

    var request = https.request(options);
    request.on ("response", onCompleteBody(this._on_push_response().bind(this)));
    request.on ("error", this._on_pushReq_error().bind(this));
    request.setHeader ("Content-type", "application/x-www-form-urlencoded");
    request.setHeader ("Authorization", "GoogleLogin auth=" + this._authToken);
    var payload = queryString.stringify({
        registration_id: registration_id,
        collapse_key: "tickle",
        "data.message": "tickle"
    });

    log.info("Trying to push " + message + "to " + registration_id);
    request.end (payload);
};

exports.Android = Android;

a = new Android();
a.on ("ready", function () {
    a.tickle ("APA91bGf4XnjFjf_-4GCqANmFvhIXYoZao2C4Q4o-eSYqgmJbegMxmJ6tJIMWjnNL0vEdoXO2ePkYQXSjBQeEdW7SjJVdNvjuTqpWXiaDv5g5tJSrxbsfD492S0NSSfVfz56R0WxCRpN");
});