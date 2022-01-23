"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SignupController = (function () {
  function SignupController(log, service, decrypt, step, id, code, password) {
    this.log = log;
    this.service = service;
    this.decrypt = decrypt;
    this.id = (id ? id : 'userId');
    this.code = (code ? code : 'code');
    this.password = (password ? password : 'password');
    this.step = (step !== undefined && step != null ? step : 1);
    this.signup = this.signup.bind(this);
    this.verify = this.verify.bind(this);
  }
  SignupController.prototype.signup = function (req, res) {
    var _this = this;
    var user = req.body;
    if (!user.username || user.username.length === 0 || !user.contact || user.contact.length === 0) {
      return res.status(401).end('username and contact cannot be empty');
    }
    if (this.step === 1) {
      if (!user.password || user.password.length === 0) {
        return res.status(401).end('password cannot be empty');
      }
      if (this.decrypt) {
        var p = this.decrypt(user.password);
        if (p === undefined) {
          return res.status(401).end('cannot decrypt password');
        } else {
          user.password = p;
        }
      }
    }
    this.service.signup(user).then(function (r) {
      res.status(200).json(r).end();
    }).catch(function (err) { return handleError(err, res, _this.log); });
  };
  SignupController.prototype.verify = function (req, res) {
    var _this = this;
    var userId = req.params[this.id];
    var passcode = req.params[this.code];
    var password = req.params[this.password];
    if ((!userId || userId.length === 0) || (!passcode || passcode.length === 0)) {
      var user = req.body;
      userId = user[this.id];
      passcode = user[this.code];
      password = user[this.password];
    }
    if (this.step !== 1) {
      if (!passcode || passcode.length === 0) {
        return res.status(401).end('password cannot be empty');
      }
      if (this.decrypt) {
        var p = this.decrypt(password);
        if (p === undefined) {
          return res.status(401).end('cannot decrypt password');
        } else {
          password = p;
        }
      }
    } else {
      password = undefined;
    }
    this.service.verify(userId, passcode, password).then(function (r) {
      res.status(200).json(r).end();
    }).catch(function (err) { return handleError(err, res, _this.log); });
  };
  return SignupController;
}());
exports.SignupController = SignupController;
function handleError(err, res, log) {
  if (log) {
    log(toString(err));
    res.status(500).end('Internal Server Error');
  } else {
    res.status(500).end(toString(err));
  }
}
exports.handleError = handleError;
function toString(v) {
  return typeof v === 'string' ? v : JSON.stringify(v);
}
exports.toString = toString;
