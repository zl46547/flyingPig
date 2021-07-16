// 云函数入口文件
const cloud = require("wx-server-sdk");
const dayjs = require("dayjs");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  try {
    // 判断当前是否已签到
    const isExit = await db
      .collection("sign_in")
      .where({
        // data 字段表示需新增的 JSON 数据
        _openid: wxContext.OPENID,
        createTime: _.gt(dayjs().startOf("days").toDate()).and(
          _.lt(dayjs().endOf("days").toDate())
        ),
      })
      .get();
    if (!isExit.data || isExit.data.length <= 0) {
      await db.collection("sign_in").add({
        // data 字段表示需新增的 JSON 数据
        data: {
          _openid: wxContext.OPENID,
          createTime: db.serverDate(),
        },
      });
      // 更新用户积分信息
      await db
        .collection("user_info")
        .where({
          _openid: wxContext.OPENID,
        })
        .update({
          // data 字段表示需新增的 JSON 数据
          data: {
            point: _.inc(event.point),
          },
        });
      return {
        msg: "签到成功",
        status: 200,
        data: {
          tomorrowPoint: event.point === 20 ? 20 : (event.point + 5),
          todayPoint: event.point,
        },
      };
    }
    return {
      errMsg: "当日已签到，不能重复签到",
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
