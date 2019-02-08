const model = require('../models');
const Op = require('sequelize').Op;
const util = require('../utils/Crypto');


exports.getSaltAndDeviceId = (phone) => {
  return new Promise((resolve, reject) => {
    model.User.findOne({
      where: {
        phone
      },
      attributes: ['salt', 'deviceId']
    })
      .then((result) => {
        result ? resolve(result) : reject(1402);
      })
  })
};


// 전화번호가 가입되어있는지 체크
exports.isUsedPhone = (phone) => {
  return new Promise((resolve, reject) => {
    model.User.findOne({
      where: {
        phone
      },
      attributes: ['id']
    }).then((result) => {
      // 휴대폰 번호가 등록되어 있다면 reject
      // 없는 번호라면 resolve
      result ? reject(1401) : resolve(true);
    })
  })
};


exports.getUserProfile = (phone) => {
  return new Promise((resolve, reject) => {
    model.User.findOne({
      where: {
        phone
      },
      attributes: ['id', 'phone', 'fcmToken', 'username', 'avatar']
    })
      .then((result) => {
        result ? resolve(result) : reject(1402);
      })
  })
};

exports.getUserProfileById = (id) => {
  return new Promise((resolve, reject) => {
    model.User.findOne({
      where: {
        id
      },
      attributes: ['id', 'phone', 'username', 'avatar', 'fcmToken']
    })
      .then((result) => {
        result ? resolve(result) : reject(1402);
      })
      .catch(e => {
        reject(e);
      })
  })
};

exports.signUp = async (userData) => {
  return new Promise((resolve, reject) => {
    model.User.create(userData)
      .then(result => resolve(result))
      .catch(error => reject(error));
  })
};

exports.signIn = (userData) => {
  return new Promise((resolve, reject) => {
    model.User.findOne({
      where: {
        [Op.and]: [{phone: userData.phone}, {password: userData.pw}, {deviceId: userData.deviceId}]
      },
      attributes: ['id', 'phone', 'avatar', 'username', 'fcmToken']
    })
      .then((result) => {
        result ? resolve(result) : reject(400);
      })
  })
};

exports.updateFcmToken = (userData) => {
  return new Promise((resolve, reject) => {
    model.User.update(
      {fcmToken: userData.fcmToken},
      {where: {[Op.and]: [{phone: userData.phone}, {password: userData.pw}]}})
      .then(result => resolve(result))
      .catch(err => reject(err));
  })
};


exports.updatePassword = (reqData) => {
  return new Promise((resolve, reject) => {
    model.User.update(
      {
        password: reqData.pw,
        salt: reqData.salt
      },
      {
        where: {
          id: reqData.id
        }
      }
    )
      .then(result => {
        result[0] === 1 ? resolve(result) : reject(400)
      })
      .catch(e => {
        reject(e);
      })
  });
};