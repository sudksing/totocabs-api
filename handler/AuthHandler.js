"use strict"
var Messages = require('../model/Messages');
var User = require('../model/User');
var bcrypt = require('bcrypt');
var Promise  = require('bluebird');
var jwt = require('jsonwebtoken');
var JWTUtils = require('../lib/JWTUtils');
var _ = require('lodash');


var SALT_WORK_FACTOR = 10;


module.exports = class AuthHandler {
	 handleRequest(reqType, db, req, res) {
		 var handler;
		 var response;
		try{
	      switch (reqType) {
	        case 'REGISTER':
	          var user = new User ({email: req.body.email,
	                  firstName: req.body.firstName,
	                  lastName: req.body.lastName,
	                  password: req.body.password,
	                  });
						this.submitRegister(user).then(function (data){
							console.log("User registerd " + data);
							response = data;
							console.log("dAta: " + JSON.stringify(data));
							return res.status(200).json(response);
						})
						.catch(function(e) {
							response = e;
							console.log("e: " + JSON.stringify(e));
							return res.status(500).json(response);
						});
						 break;
					case 'LOGIN':
									var pr =  this.logon(req.body.email, req.body.password);
									pr.then(function(resp){
										response = resp;
										console.log ("user logon isUserAuth: " + response);
										return res.status(200).json(response);
									}).catch(function(e) {
										response = e;
										console.log("e: " + JSON.stringify(e));
										return res.status(500).json(response);
									});
							break;
					case 'SEND_FEEDBACK':
								var sendFeedbackPromise = this.sendFeedback(req);
								sendFeedbackPromise.then(function(result){
									response = result;
									console.log ("Message Sent: " + JSON.stringify(response));
									return res.status(200).json(response);
								}).catch(function(e) {
									response = e;
									console.log("e: " + JSON.stringify(e));
									return res.status(500).json(response);
								});
							break;
					case 'SEE_FEEDBACK':
								var seeFeedbackPromise = this.seeFeedback(req.body.email);
								seeFeedbackPromise.then(function(result){
									response = result;									
									return res.status(200).json(response);
								}).catch(function(e) {
									response = e;
									console.log("e: " + JSON.stringify(e));
									return res.status(500).json(response);
								});
							break;
	        default:
	  				throw new Error('Unknown request type specified!');
	      }
	    } catch (err) {
	      console.log(err);
	  }
	}

	sendFeedback(req){
		var result;
		var msgData;
		return new Promise(function (resolve, reject){
			msgData = new Messages({
				sEmail: req.body.sEmail,
		    rEmail: req.body.rEmail,
		    message: req.body.message,
		    timestampSent: (new Date().getTime()),
		    ipAddressSent: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		    msgStatus: 'D',
			});
			result =  msgData.save(function(err, data){
			 if (err) {
				 var response = { result: false, error: "Error while saving the user!"};
					 return reject (response);
			 } else {
				 return resolve(result)
			 }
		 });
		});
	}

	seeFeedback(email) {
		return new Promise(function (resolve, reject) {
								var msgs = Messages.find({ rEmail: email }, function (err, data){
								if (err){
									reject(err);
								} else {
									if (_.isEmpty(data)) {
										reject ({ result: "success", msg: "No message Found."});
									} else {
										resolve (data);
									}
								}
							});
						});
					}

	submitRegister(user){
		var result;
		var userData;
		var P = this.getUser(user.email)
			.then(function(data){
				return new Promise(function (resolve, reject){
					if (data){
						return reject({result: 'error', msg: 'User already exist'});
					} else {
						userData = new User({ firstName: user.firstName, lastName: user.lastName
							, email: user.email, password: user.password})
						 result =  userData.save(function(err, data){
							if (err) {
								response = { message:
										{ error: "Error while saving the user!"}
									};
									return reject (response);
							} else {
								return resolve(result)
							}
						});
					}
				});
			});
			return P;
	}

		getUser(email) {
  		return new Promise(function (resolve, reject) {
									var user = User.findOne({ email: email }, function (err, data){
									if (err){
										reject(err);
									} else {
										resolve (user);
									}
									console.log("getUser: " + user);
  							});
							});
						}

		logon(email, password) {
				var response;
				var user;
				var P = this.getUser(email)
				.then (function(user){
					return new Promise(function (resolve, reject){
						console.log("\n Logon user: " + user);
						if (user == null){
							reject ({
								result: "Error", message: "Userid/Password is wrong."
							});
						}
						console.log("\n Logon: " + password + ' ' +user.password);
						if (password == null || user.password == null) {
							reject ({
								result: "Error", message: "Userid/Password is wrong."
							});
						}

						bcrypt.compare(password, user.password, function(err, res) {
		 							if (err) {
		 								console.log (err);
										reject(err);
		 							}
									if (res){
				 							resolve({result:
												{
													userName: user.firstName,
													id: user._id,
													auth: res
												}
											});
										} else {
											reject ({
												result: "Error", message: "Userid/Password is wrong."
											});
										}
		 						});
					})
					.then(function (res){
						return new Promise(function (resolve, reject){
							console.log ("resolve: " + JSON.stringify(res));
							var jwt = new JWTUtils();
							var claimSet = jwt.getClaimSet(res.result.id);
							var jToken = jwt.create(claimSet);
							resolve({result:
								{
									userName: res.result.userName,
									auth: res.result.auth,
									id: res.result.id,
									accessToken: jToken
								}
							});
						});
					});
				});

				return P;
		}


	}
