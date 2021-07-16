const cloud = require("wx-server-sdk");
const dayjs = require("dayjs");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

exports.main = async (event, context) => {
  // 从云开发数据库中查询等待发送的消息列表
  const messages = await db
    .collection("subscribe_message")
    .where({
      isSend: false,
    })
    .get();

  try {
    // 循环消息列表依次处理下发订阅操作
    messages.data.map(async (message) => {
      // 发送订阅消息
      await cloud.openapi.subscribeMessage.send({
        touser: message.touser,
        page: message.page,
        data: {
          phrase1: {
            value: "飞猪外卖每日签到",
          },
          time2: {
            value: dayjs().format("YYYY-MM-DD"),
          },
          thing4: {
            value: `叮咚！今日签到可以获得${message.point}积分哦`,
          },
          thing3: {
            value: `本月已签到${message.signedDays}天`,
          },
        },
        templateId: message.templateId,
        miniprogramState: "developer",
      });
      // 发送成功后将消息的状态改为已发送
      await db
        .collection("subscribe_message")
        .doc(message._id)
        .update({
          data: {
            isSend: true,
          },
        });
    });
    return {
      msg: "签到提醒发送成功",
      status: 200,
    };
  } catch (e) {
    return {
      status: "-1000",
      errMsg: "服务出错了",
      data: e,
    };
  }
};