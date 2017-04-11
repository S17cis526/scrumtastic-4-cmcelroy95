/** @module sessions
 * a module representing a user session
 */

module.exports = {
  create: create,
  destroy: destroy,
  loginRequired: loginRequired
};

var json = require('../../lib/form-json');

/** @function create
 * Creates a new session
 */
function create(req, res, db) {
  json(req, res, function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    db.get("SELECT * FROM users WHERE username=?", [username], function(err, user){
      if(err){
        console.error(err);
        res.statusCode = 500;
        res.end("Server eror");
        return;
      }
      if(!user){
        // username not in database
        res.statusCode = 403;
        res.end("Incorrect username/password");
        return;
      }
      var cryptedPassword = encryption.digest(password + user.salt);
      if(cryptedPassword != user.cryptedPassword) {
        // invalid password/username combination
        res.statusCode = 403;
        res.end("Incorrect username/password");
        return;
      }
      else {
        // successful login!
        // store user.id in the cookies
        var cookieData = JSON.stringify({userId: user.id});
        var encryptedCookieData = encryption.encipher(cookieData);
        // Encrypt userid
        res.setHeader("Set-Cookie", ["session=" + encryptedCookieData]);
        res.statusCode = 200;
        res.end("Successful Login");
      }
    });
  })
}



function destroy(req, res){
  res.setHeader("Set-Cookie", "");
  res.statusCode = 200;
  res.end("Looged out succesfully");
}

function loginRequired(req, res, next) {
  var session = req.headers.cookie.session;
  var sessionData = encryption.decipher(session);
  var sessionObj = JSON.parse(sessionData);
  if(sessionObj.userId){
    req.currentUserId = sessionObj.userId;
    retun next(req, res);
  } else {
    res.statusCode = 403;
    res.end("Authentication required");
  }
}
