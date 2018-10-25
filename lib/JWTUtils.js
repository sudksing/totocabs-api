'use strict';
const jsonWebToken = require('jsonwebtoken');

module.exports = class JWTUtils{
  constructor(){
    this.key = 'asdfglkjhgfafafaferercvreroviodfioxpsdofifservcvdfereoicvjxvjofisodfwworexvxcvsfsdferefafdfefe';
  }

  getClaimSet(uid, expireTime){

  return {
      iss: 'feedbackdo',
      sub: 'feedbackdo_JWT',
      aud: 'feedbackdo.com',

      uid: uid,
      iat: (new Date().getTime()),
      };
  }

  create(claimSet) {
		console.log('JWTUtils.create - start');
		try{

			// if ((!_.isObject(claimSet)) || _.isEmpty(claimSet)) {
			// 	throw new Error('Payload is empty');
			// }
			// const options = {
			// 	algorithm: 'RS256'
			// };

			//return jsonWebToken.sign(claimSet, key, options);
      var d = new Date();
      var calculatedExpiresIn = (((d.getTime()) + (60 * 60 * 1000)) - (d.getTime() - d.getMilliseconds()) / 1000);
      return jsonWebToken.sign(claimSet, this.key, { expiresIn: calculatedExpiresIn });

		}catch (err) {
      console.log(err);
			throw new Error('FAILED to create Token.', err);
		}finally{
			console.log('JWTUtils.create - end');
		}
	}

  decoded(token){
    var key = this.key;
    return new Promise (function (resolve, reject){
      jsonWebToken.verify(token, key, function(err, dec) {
        if (err) {
          //console.log("inside error" + err);
          reject ({ success: false, message: 'Failed to authenticate token.' });
        } else {
          //console.log (" before resolve decoded: " + JSON.stringify(dec));
          resolve(dec);
        }
      });
    });

  }

}
