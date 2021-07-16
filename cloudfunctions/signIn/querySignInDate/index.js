// 云函数入口文件
const cloud = require("wx-server-sdk");
const dayjs = require("dayjs");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
// 创建集合云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  try {
    const hasSignInDateList = await db
      .collection("sign_in")
      .where({
        // data 字段表示需新增的 JSON 数据
        _openid: wxContext.OPENID,
        createTime: _.gte(dayjs().startOf("months").toDate()).and(
          _.lte(dayjs().endOf("months").toDate())
        ),
      })
      .get();
    return {
      status: 200,
      data: hasSignInDateList.data.map((item) => {
        return { date: dayjs(item.createTime).format("YYYY-MM-DD"), type: 1 };
      }),
    };
  } catch (e) {
    return {
      status: "-1000",
      errMsg: "服务出错了",
      data: e,
    };
  }
};
