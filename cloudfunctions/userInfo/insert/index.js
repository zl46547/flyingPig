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
    const isExit = await db
      .collection("user_info")
      .where({
        _openid: wxContext.OPENID,
      })
      .get();
    if (!isExit.data || isExit.data.length <= 0) {
      await db.collection("user_info").add({
        data: {
          ...event,
          _openid: wxContext.OPENID,
        },
      });
      return {
        msg: "用户信息保存成功",
        status: 200,
      };
    }
    return {
      status: 200,
      msg: "该用户已存在",
    };
  } catch (e) {
    return {
      status: "-1000",
      errMsg: "服务出错了",
      data: e,
    };
  }
};
