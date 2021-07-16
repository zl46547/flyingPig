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
    const userInfo = await db
      .collection("user_info")
      .where({
        // data 字段表示需新增的 JSON 数据
        _openid: wxContext.OPENID,
      })
      .get();
    if (userInfo.data && userInfo.data.length <= 0) {
      return {
        status: 200,
        msg: "用户不存在",
        data: undefined,
      };
    }
    return {
      status: 200,
      data: userInfo.data[0],
    };
  } catch (e) {
    return {
      status: "-1000",
      errMsg: "服务出错了",
      data: e,
    };
  }
};
