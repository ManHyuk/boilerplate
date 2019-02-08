'use strict';

const authService = require('../services/AuthService');

/*******************
 *  Authenticate
 ********************/
const AuthMiddleware = () => {
  const auth = (req, res, next) => {

    if (!req.headers.token) {
      return next(401);
    }

    authService().verify(req.headers.token, (err, id, name) => {
      if (err) {
        return next(err);
      } else {
        req.userId = id;
        req.userName = name;
        return next();
      }
    })

  };
  return {auth};
};

module.exports = AuthMiddleware;


// exports.auth = (req, res, next) => {
//   if (!req.headers.token) {
//     return next(401);
//   }
//
//   authService().verify(req.headers.token, (err, userId) => {
//     if (err) {
//       return next(err);
//     } else {
//       req.userId = userId;
//       return next();
//     }
//   })
// };