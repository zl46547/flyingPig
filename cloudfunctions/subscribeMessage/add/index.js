// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
// 创建集合云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  try {
    const res = await db.collection("subscribe_message").add({
      data: {
        touser: wxContext.OPENID, // 订阅者的openid
        page: "pages/sign_in/sign_in", // 订阅消息卡片点击后会打开小程序的哪个页面，注意这里的界面是线下小程序有的，否则跳不过去
        templateId: event.templateId, // 订阅消息模板ID
        isSend: false, // 消息发送状态设置为 false
        point: event.point,
        signedDays: event.signedDays,
      },
    });
  } catch (e) {
    return {
      status: "-1000",
      errMsg: "服务出错了",
      data: e,
    };
  }
};
