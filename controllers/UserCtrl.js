const model = require('../models');
const util = require('../utils/Crypto');
const userService = require('../services/UserService');

exports.signUp = async (req, res, next) => {
  let result;

  try {

    const {pw, salt} = util.doCipher(req.body.password);

    const userData = {
      phone: req.body.phone,
      username: req.body.username,
      password: pw,
      salt: salt,
      fcmToken: req.body.fcmtoken,
      avatar: DEFAULT.AVATAR,
      deviceId: req.body.deviceId
    };

    const result = userService.signUp(userData, next);

    // await userService().isUsedPhone(userData.phone);
    // const user = await userService().signUp(userData);

    // FCM SUBSCRIBE
    // await externalService().fcm().subscribeToTopic(user.fcmToken, user.phone);

    // const token = authService().issue({id: user.id, phone: user.phone});

    // result = {
    //   profile: {
    //     id: user.id,
    //     phone: user.phone,
    //     username: user.username
    //   }, token
    // }

  } catch (error) {
    return next(error);
  }

  return res.r(result);
};


exports.signIn = async (req, res, next) => {

  let result;

  try {

    const {salt, deviceId} = await userService().getSaltAndDeviceId(req.body.phone);

    const userData = {
      phone: req.body.phone,
      pw: util.doCipher(req.body.password, salt).pw,
      fcmToken: req.body.fcmtoken,
      deviceId: !req.body.deviceId ? deviceId : req.body.deviceId
    };

    // phone, pw 조회해서 값이 있다면 로그인 성공 -> 토큰 발급
    const user = await userService().signIn(userData);

    await userService().updateFcmToken(userData);

    // FCM SUBSCRIBE
    await externalService().fcm().subscribeToTopic(user.fcmToken, user.phone);

    const token = authService().issue({id: user.id, phone: user.phone});

    result = {
      profile: {
        id: user.id,
        phone: user.phone,
        username: user.username
      }, token
    }

  } catch (error) {
    return next(error);
  }

  return res.r(result);

};

exports.getProfile = async (req, res, next) => {
  let result;

  try {

    result = await model.User.findOne({
      where: {
        id: req.userId
      },
      attributes: ['id', 'username', 'avatar']
    });


  } catch (error) {
    return next(error);
  }

  return res.r(result);
};

exports.editProfile = async (req, res, next) => {
  try {

    const userData = {
      username: req.body.username,
      avatar: !req.file ? null : req.file.location
    };

    await model.User.update(
      userData, {where: {id: req.userId}});

  } catch (error) {
    return next(error);
  }

  return res.r();
};

exports.editPassword = async (req, res, next) => {

  try {

    const {pw, salt} = util.doCipher(req.body.password);

    const reqData = {
      id: req.userId,
      salt,
      pw
    };



  } catch (error) {
    return next(error);
  }

  return res.r();
};