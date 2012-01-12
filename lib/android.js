var util = require ("util");
var https = require ("https");
var queryString = require ("querystring");

var timers = require ("./timer.js");
var Devices = require ("./devices.js");
var pushUtils = require ("./push-utils.js");

var onCompleteBody = pushUtils.onCompleteBody;
var log = require ("./log.js").getLogger ("[ANDROID]");

var config = {
    userName: "android@talk.to"
    , password: "*h*wOOl2"
    , clientAuthHost: "www.google.com"
    , clientAuthPath: "/accounts/ClientLogin"
    , clientLoginUrl: "https://www.google.com/accounts/ClientLogin"

    , pushUrlHost: "android.apis.google.com"
    , pushUrlPath: "/c2dm/send"

    , accountType: "GOOGLE"
    , service: "ac2dm"
    , collapseKey: "collapse_key"
};

function Android () {
    this._userName = config.userName;
    this._password = config.password;
    this._clienAuthHost = config.clientAuthHost || "www.google.com";
    this._clienAuthPath = config.clientAuthPath || "/accounts/ClientLogin";
    this._clientLoginUrl = config.clientLoginUrl || "https://www.google.com/accounts/ClientLogin";

    this._pushUrlHost = config.pushUrlHost || "android.apis.google.com";
    this._pushUrlPath = config.pushUrlPath || "/c2dm/send";

    this._service = config.service || "ac2dm";
    this._accountType = config.accountType || "HOSTED_OR_GOOGLE";
    this._collapseKey = config.collapseKey || "default";

    this._getClientAuthToken ();
};

Android.prototype = new Devices ("talk.to", "android");

Android.prototype._on_clientAuth_response = function (statusCode, body) {
    var parsedRes = queryString.parse(body, "\n");
    if (statusCode !== 200) {
        log.error ("Auth Error: %s %s", statusCode, parsedRes.Error);
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
          host: this._clienAuthHost
        , path: this._clienAuthPath
        , method: "POST"
    };

    var request = https.request (options);
    request.on ("response", onCompleteBody(this._on_clientAuth_response.bind(this)));
    request.on ("error", this._on_clientAuthReq_error.bind(this));
    request.setHeader ("Content-type", "application/x-www-form-urlencoded");

    var authBody = queryString.stringify({
        accountType: this._accountType
        , Email: this._userName
        , Passwd: this._password
        , service: this._service
    });

    log.info ("Requesting ClientAuthToken");
    request.end (authBody);
};

Android.prototype._on_pushReq_error = function (registration_id, push_id) {
    return function (err) {
        
    }.bind(this);
};

Android.prototype._on_push_response = function (registration_id, push_id, headers) {
    return function (statusCode, body) {
        switch (statusCode) {
        case 200:
            var response = queryString.parse (body, "\n");
            
            this.emit ("pushed", registration_id, push_id);
            log.info ("pushed " + push_id + " to " + registration_id);
            break;
        case 401:
            this.emit ("push-failed", registration_id, push_id);
            log.error ("AUTH-TOKEN invalid");
            this.emit ("error", "Invalid Auth-Token");
            break;
        case 503:
            this.emit ("push-failed", registration_id, push_id);
            log.error (
            break;
        }
    }.bind(this);
};

/*
  pushes the given payload to the client with 
  registration_id = registration_id. retries 
  in case of network/service error. honors 
  retry-after header or does an exponential backoff.

  returns push_id that can be used to uniquely 
  identify a payload for a registration id.

  returns false if device with registration 
  id = registration_id is not registered.  

  emits "pushed" on success (registration_id, push_id)
  emits "push-failed" on failure.

  
*/
Android.prototype.push = function (registration_id, message) {
    var push_id = Devices.prototype.push.call (this, registration_id, message);
    if (push_id === false) return false;

    var options = {
        host: this._pushUrlHost
        , path: this._pushUrlPath
        , method: "POST"
    };

    var request = https.request (options);
    request.on ("response", onCompleteBody(this._on_push_response(registration_id, push_id).bind(this)));
    request.on ("error", this._on_pushReq_error(registration_id, message).bind(this));
    request.setHeader ("Content-type", "application/x-www-form-urlencoded");
    request.setHeader ("Authorization", "GoogleLogin auth=" + this._authToken);

    var payload = queryString.stringify ({
        registration_id: registration_id
        , collapse_key: "tickle"
        , "data.message": "hello"
        , "data.sid": "randomsid"
        , "from": "hero"
        , "data.collapse_key": "crumble"
    });

    log.info("Trying to push " + message + "to " + registration_id);
    request.end (payload);
    return push_id;
};

/* 
   Sends a empty message with collapse key set to 
   tickle. This can be used to inform the client
   the server has some payload to send to the
   client.
*/
Android.prototype.tickle = function (registration_id) {
    return this.push (registration_id, "");
};

exports.Android = Android;
