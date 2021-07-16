// 云函数入口文件
const cloud = require("wx-server-sdk");
const add = require("./add/index");

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "add":
      return await add.main(event.data, context);
  }
};
