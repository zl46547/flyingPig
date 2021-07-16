// 云函数入口文件
const cloud = require("wx-server-sdk");
const insert = require("./insert/index");
const querySignInDate = require("./querySignInDate/index");

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "insert":
      return await insert.main(event.data, context);
    case "querySignInDate":
      return await querySignInDate.main(event.data, context);
  }
};
