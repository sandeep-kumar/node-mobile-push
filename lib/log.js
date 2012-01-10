var log4js = require("log4js");

log4js.clearAppenders();
log4js.addAppender(log4js.consoleAppender());

log4js.setGlobalLogLevel("debug");
module.exports = log4js;