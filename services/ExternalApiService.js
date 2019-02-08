'use strict';

const admin = require('firebase-admin');

// const firebaseAdmin = require('../config/firbase_admin');


const ExternalApiService = () => {


  const fcm = () => {

    // 중복 초기화 방지
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdmin)
      });
    }

    // Topic 구독
    const subscribeToTopic = (fcmToken, topic) => {
      return new Promise((resolve, reject) => {

        admin.messaging().subscribeToTopic(fcmToken, topic)
          .then(res => {
            resolve(res);
          })
          .catch(err => {
            reject(err);
          });
      });
    };

    // FCM 전송
    const sendToTopic = (topic, data) => {
      return new Promise((resolve, reject) => {
        const sendData = {
          data: {
            username: data.from,
            message: data.message,
            photourl: data.url || ''
          },
        };

        admin.messaging().sendToTopic(topic, sendData)
          .then((res) => {
            resolve(res);
          })
          .catch((err) => {
            reject(err)
          });
      });
    };


    const sendToDevice = (fcmToken) => {
      return new Promise((resolve, reject) => {
        const sendData = {
          data: {
            username: 'name',
            message: 'msg',
            photourl: 'http://db.kookje.co.kr/news2000/photo/2018/0804/L20180804.99099001785i1.jpg'
          },
        };
        admin.messaging().sendToDevice(fcmToken, sendData)
          .then(res => {
            console.log('res', res);
            resolve(res)
          })
          .catch(e => {
            console.log(e);
            reject(e);
          })
      })
    };

    return {
      subscribeToTopic,
      sendToTopic,
      sendToDevice
    }
  };

  return {
    fcm
  };
};

module.exports = ExternalApiService;