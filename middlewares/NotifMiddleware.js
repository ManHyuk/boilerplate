'use strict';

const postService = require('../services/PostService');
const externalService = require('../services/ExternalApiService');
const notifService = require('../services/NotifService');

const {POST_STATUS, NOTIF_TYPE, MATCH_STATUS} = require('../utils/Constants');

const NotifMiddleware = () => {

  const createPushAndNotif = async (postId, status, transaction) => {

    const {push, notif} = await setPushAndNotif(postId, status, transaction);


    // 배송원이 신청할 때만 두번 전송
    if (status === POST_STATUS.PROGRESS || status === MATCH_STATUS.DELIVER_CANCEL) {

      await externalService().fcm().sendToTopic(push.sender.topic, push.sender.data);
      await notifService().createNotif(notif.sender, transaction);

      await externalService().fcm().sendToTopic(push.receiver.topic, push.receiver.data);
      await notifService().createNotif(notif.receiver, transaction);

    } else if (status === POST_STATUS.RECEIVER_DONE) {

      await externalService().fcm().sendToTopic(push.sender.topic, push.sender.data);
      await notifService().createNotif(notif.sender, transaction);

      await externalService().fcm().sendToTopic(push.receiver.topic, push.receiver.data);
      await notifService().createNotif(notif.receiver, transaction);

      await externalService().fcm().sendToTopic(push.deliver.topic, push.deliver.data);
      await notifService().createNotif(notif.deliver, transaction);

    } else {

      await externalService().fcm().sendToTopic(push.topic, push.data);
      await notifService().createNotif(notif, transaction);
    }

  };

  return {
    createPushAndNotif
  };


};


module.exports = NotifMiddleware;


// FIXME 코드 중복 제거
const setPushAndNotif = async (postId, status, transaction) => {
  const data = await postService().getPostWithUser(postId, transaction);

  const push = {};
  const notif = {};

  if (status === POST_STATUS.PENDING) {
    push.topic = data.receiver.phone;
    push.data = {
      from: data.sender.username,
      message: `${data.sender.username}님이 배송 수락을 요청 했습니다`,
      url: data.dataValues.image
    };

    notif.to = data.receiver.id;
    notif.from = data.sender.id;
    notif.type = NOTIF_TYPE.SENDER_TO_RECEIVER;

    notif.message =  push.data.message;
    notif.image = push.data.url;
    notif.postId = postId;

  } else if (status === POST_STATUS.ACCEPT) {
    push.topic = data.sender.phone;
    push.data = {
      from: data.receiver.username,
      message: `${data.receiver.username}님이 배송을 수락 했습니다`,
      url: data.dataValues.image
    };

    notif.to = data.sender.id;
    notif.from = data.receiver.id;
    notif.type = NOTIF_TYPE.RECEIVER_TO_SENDER;

    notif.message =  push.data.message;
    notif.image = push.data.url;
    notif.postId = postId;

  } else if (status === POST_STATUS.CANCEL) {
    push.topic = data.receiver.phone;
    push.data = {
      from: data.sender.username,
      message: `${data.sender.username}님이 배송을 취소 했습니다`,
      url: data.dataValues.image
    };

    notif.to = data.receiver.id;
    notif.from = data.sender.id;
    notif.type = NOTIF_TYPE.SENDER_TO_RECEIVER;

    notif.message =  push.data.message;
    notif.image = push.data.url;
    notif.postId = postId;

  } else if (status === POST_STATUS.REJECT) {
    push.topic = data.sender.phone;
    push.data = {
      from: data.receiver.username,
      message: `${data.receiver.username}님이 배송을 거절 했습니다`,
      url: data.dataValues.image
    };

    notif.to = data.sender.id;
    notif.from = data.receiver.id;
    notif.type = NOTIF_TYPE.RECEIVER_TO_SENDER;

    notif.message =  push.data.message;
    notif.image = push.data.url;
    notif.postId = postId;

  } else if (status === POST_STATUS.DELIVER_DONE) {
    push.topic = data.receiver.phone;
    push.data = {
      from: data.match[0].deliver.username,
      message: `${data.match[0].deliver.username}님이 배송완료를 요청 했습니다`,
      url: data.dataValues.image
    };

    notif.to = data.receiver.id;
    notif.from = data.match[0].deliver.id;
    notif.type = NOTIF_TYPE.DELIVER_TO_RECEIVER;

    notif.message =  push.data.message;
    notif.image = push.data.url;
    notif.postId = postId;

  } else if (status === POST_STATUS.PROGRESS) {
    const sender = {
      topic: data.sender.phone,
      data: {
        from: data.match[0].deliver.username,
        message: `${data.match[0].deliver.username}님이 배송을 시작 했습니다`,
        url: data.match[0].deliver.avatar
      }
    }; // sender, receiver
    const senderNotif = {
      to: data.sender.id,
      from: data.match[0].deliver.id,
      type: NOTIF_TYPE.DELIVER_TO_SENDER_RECEIVER,
      message: sender.data.message,
      image: sender.data.url,
      postId: postId
    };

    const receiver = {
      topic: data.receiver.phone,
      data: {
        from: data.match[0].deliver.username,
        message: `${data.match[0].deliver.username }님이 배송을 시작 했습니다`,
        url: data.match[0].deliver.avatar
      }
    };

    const receiverNotif = {
      to: data.receiver.id,
      from: data.match[0].deliver.id,
      type: NOTIF_TYPE.DELIVER_TO_SENDER_RECEIVER,
      message: receiver.data.message,
      image: sender.data.url,
      postId: postId
    };

    push.sender = sender;
    push.receiver = receiver;

    notif.sender = senderNotif;
    notif.receiver = receiverNotif;
  } else if (status === MATCH_STATUS.DELIVER_CANCEL) {
    const sender = {
      topic: data.sender.phone,
      data: {
        from: data.match[0].deliver.username,
        message: `${data.match[0].deliver.username}님이 배송을 취소 했습니다`,
        url: data.match[0].deliver.avatar
      }
    }; // sender, receiver
    const senderNotif = {
      to: data.sender.id,
      from: data.match[0].deliver.id,
      type: NOTIF_TYPE.DELIVER_TO_SENDER_RECEIVER,
      message: sender.data.message,
      image: sender.data.url,
      postId: postId
    };

    const receiver = {
      topic: data.receiver.phone,
      data: {
        from: data.match[0].deliver.username,
        message: `${data.match[0].deliver.username }님이 배송을 취소 했습니다`,
        url: data.match[0].deliver.avatar
      }
    };

    const receiverNotif = {
      to: data.receiver.id,
      from: data.match[0].deliver.id,
      type: NOTIF_TYPE.DELIVER_TO_SENDER_RECEIVER,
      message: receiver.data.message,
      image: sender.data.url,
      postId: postId
    };

    push.sender = sender;
    push.receiver = receiver;

    notif.sender = senderNotif;
    notif.receiver = receiverNotif;

  } else if (status === POST_STATUS.RECEIVER_DONE) {
    const sender = {
      topic: data.sender.phone,
      data: {
        from: data.receiver.username,
        message: `${data.receiver.username}님이 배송을 완료 했습니다`,
        url: data.dataValues.image
      }
    };

    const senderNotif = {
      to: data.sender.id,
      from: data.receiver.id,
      type: NOTIF_TYPE.RECEIVER_TO_SENDER_DELIVER,
      message: sender.data.message,
      image: sender.data.url,
      postId: postId
    };


    const receiver = {
      topic: data.receiver.phone,
      data: {
        from: data.receiver.username,
        message: `${data.receiver.username}님이 배송을 완료 했습니다`,
        url: data.dataValues.image
      }
    };

    const receiverNotif = {
      to: data.receiver.id,
      from: data.receiver.id,
      type: NOTIF_TYPE.RECEIVER_TO_SENDER_DELIVER,
      message: receiver.data.message,
      image: receiver.data.url,
      postId: postId
    };


    const deliver = {
      topic: data.match[0].deliver.phone,
      data: {
        from: data.receiver.username,
        message: `${data.receiver.username}님이 배송을 완료 했습니다`,
        url: data.dataValues.image
      }
    };

    const deliverNotif = {
      to: data.match[0].deliver.id,
      from: data.receiver.id,
      type: NOTIF_TYPE.RECEIVER_TO_SENDER_DELIVER,
      message: deliver.data.message,
      image: deliver.data.url,
      postId: postId
    };

    push.sender = sender;
    push.receiver = receiver;
    push.deliver = deliver;

    notif.sender = senderNotif;
    notif.receiver = receiverNotif;
    notif.deliver = deliverNotif;



  }




  return {push, notif};
};