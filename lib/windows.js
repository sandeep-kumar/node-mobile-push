var util = require("util");
var http = require("http");
var url = require("url");
var queryString = require("querystring");

var Devices = require("./devices.js");
var pushUtils = require("./push-utils.js");

var Timer = require("./timer.js");

var onCompleteBody = pushUtils.onCompleteBody;
var log = require("./log.js").getLogger("[WINDOWS]");


function Windows () {
	console.log("inside windows");
	setTimeout(function(){
		this.emit ("ready");
	}.bind(this),2000);
	
};

Windows.prototype = new Devices("talk.to", "windows");

Windows.prototype._on_push_response = function (registration_id, message) {
    return function(statusCode, body, response_headers){
			var responseNotificationState = response_headers ['X-NotificationStatus'];
			var responseSubscriptionState = response_headers ['X-SubscriptionStatus'];
			var responseDeviceConnectionStatus = response_headers ['X-DeviceConnectionStatus'];

			if (responseSubscriptionState === 'Expired') {
				log.info("Drop the subscription state of registration_id" + registration_id + " and doesn't send any further push notification");
				this.unregister(registration_id);
				return;
			} else if (statusCode === 200){
				if (responseNotificationState === 'Received') {
					log.info("Message " + message + " send to " + registration_id);
				} else if (responseNotificationState === 'QueueFull') {
					log.info("Resend the message " + message + " using exponential backoff to registration_id " + registration_id);
					
				} else if(responseNotificationState === 'Suppressed') {
					console.log("push notification is supressed of a particular push notification class");
				}	
			} else if (statusCode === 400) {
				log.error("Bad request due to Malformed XML for registration id " + registration_id);
			} else if (statusCode === 401) {
				log.error("Unauthorised request for registration id " + registration_id);
			} else if (statusCode === 404) {
				this.unregister(registration_id);
				log.error("Dropped due to invalid subscription for registration id " + registration_id);
			} else if (statusCode === 405) {
				log.error("Method not allowed for registration id " + registration_id);
			} else if (statusCode === 406) {
				log.error("Not acceptable the unathenticated service has reached a daily limit for registration id " + registration_id);
			} else if (statusCode === 412) {
				log.error("Device inactive try sending it after 1 hrs but dont violates the maximum of one re-attempt per hour for registration id " + registration_id);
			} else if (statusCode === 503) {
				log.error("Service Unavailable for registration id " + registration_id);
			}	
    }.bind(this);
};

Windows.prototype._on_pushReq_error = function (registration_id, message) {
    return function (statusCode, body, response_headers) {
    }.bind(this);
};

Windows.prototype.push = function(registration_id, message, description) {
	log.info("push message " + message + " from " + description + " to " + registration_id);
	var registered_data = Devices.prototype.push.call(this, registration_id, message);
    if (registered_data === false) return false;

	var uri_data = url.parse(registered_data.push_URI);
	console.log(uri_data.host);
	console.log(uri_data.pathname);
	var options = {
	  host: uri_data.host,
	  path: uri_data.pathname,
	  method: 'POST',
	  headers: {}
	};		
	
	this.send_toast_message(registration_id, options, description, message, "/Page2.xaml?NavigatedFrom=Toast Notification");
};

Windows.prototype.send_toast_message = function(registration_id, options , description, message, callbackURL){
	var payload = "<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
						"<wp:Notification xmlns:wp=\"WPNotification\">" +
							"<wp:Toast>" +
								"<wp:Text1>" + description + "</wp:Text1>" +
								"<wp:Text2>" + message + "</wp:Text2>" +
								"<wp:Param>" + callbackURL + "</wp:Param>" +
							"</wp:Toast>" +
						"</wp:Notification>";
	
	
	var request = http.request(options);
	request.on ("response", onCompleteBody(this._on_push_response(registration_id, message).bind(this)));
    request.on ("error", this._on_pushReq_error(registration_id, message).bind(this));
	request.setHeader ("Content-Type", "text/xml");
	request.setHeader ("Content-Length", payload.length);
	request.setHeader ("X-WindowsPhone-Target", "toast");
	request.setHeader ("X-NotificationClass", "2");
	
	request.write(payload);
	request.end();	
};

Windows.prototype.tickle = function (registration_id) {
    return this.push(registration_id, "Hello", "Sandeep");
};

exports.Windows = Windows;

windows = new Windows();

windows.on ("ready", function () {
	console.log("Inside ready");
    var URI = "http://db3.notify.live.net/throttledthirdparty/01.00/AAE0R4lu2ccIRbCeWZolzYQJAgAAAAADAQAAAAQUZm52OjIzOEQ2NDJDRkI5MEVFMEQ"
    windows.register ("123", URI, "/Page2.xaml?NavigatedFrom=Toast Notification");
    var r = windows.tickle ("123");
});