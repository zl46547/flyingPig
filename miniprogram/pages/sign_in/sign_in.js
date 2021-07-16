const dayjs = require("./dayjs");

var app = getApp();
// pages/sign_in/sign_in.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    envId: "",
    dayList: [],
    signedDayList: [],
    todayIsSigned: false,
    showMonth: dayjs().format("M"),
    showSuccessModal: false,
    userInfo: undefined,
    tomorrowPoint: 0,
    todayPoint: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.setData({
      envId: options.envId,
    });
    // 渲染日历信
    await this.initDateList();
    // 获取用户信息
    try {
      let userInfo = await this.getUserInfo();
      if (userInfo) {
        this.setData({
          userInfo,
        });
        // 获取已签到日期
        await this.handleDateListBySignedDays();
      }
    } catch (e) {
      console.log(e);
    }
  },
  async subscribeMessage() {
    let todayPoint = this.getTodayPoint();
    try {
      const subscribeMessageRes = await wx.requestSubscribeMessage({
        tmplIds: [app.globalData.tmplId],
      });
      if (subscribeMessageRes[app.globalData.tmplId] === "reject") {
        return;
      }
      await wx.cloud.callFunction({
        name: "subscribeMessage",
        config: {
          env: this.data.envId,
        },
        data: {
          type: "add",
          data: {
            templateId: app.globalData.tmplId,
            point: todayPoint === 20 ? 20 : todayPoint + 5,
            signedDays: this.data.signedDayList.length,
          },
        },
      });
    } catch (e) {}
  },
  /**
   * 从数据库中获取用户信息
   * @returns {Promise<void>}
   */
  async getUserInfo() {
    try {
      const userInfo = await wx.cloud.callFunction({
        name: "userInfo",
        config: {
          env: this.data.envId,
        },
        data: {
          type: "query",
        },
      });
      if (userInfo.result && userInfo.result.status === 200) {
        return userInfo.result.data;
      }
    } catch (e) {
      console.log(e);
    }
  },
  handleClose() {
    this.setData({
      showSuccessModal: false,
    });
  },
  /**
   * 初始化日历
   */
  initDateList() {
    const dayList = [];
    const startDate = dayjs().startOf("months").startOf("weeks").unix();
    const endDate = dayjs().endOf("months").endOf("weeks").unix();
    for (let i = startDate; i <= endDate; i += 24 * 60 * 60) {
      const date = dayjs(i * 1000).format("YYYY-MM-DD");
      dayList.push({
        day: dayjs(i * 1000).format("DD"),
        date,
        isNowDate: i === dayjs().startOf("days").unix(),
        notCurrentMonth: dayjs(i * 1000).month() !== dayjs().month(),
      });
    }
    //初始化加载日历
    this.setData({
      dayList,
    });
  },
  /**
   * 获取已签到的日期
   * @returns {Promise<void>}
   */
  async handleDateListBySignedDays(signedDayList) {
    if (!signedDayList) {
      const querySignInDateRes = await this.querySignInDate();
      if (querySignInDateRes && querySignInDateRes.result.status === 200) {
        signedDayList = querySignInDateRes.result.data;
      }
    }

    const dayList = this.data.dayList.map((dayItem) => {
      return {
        ...dayItem,
        signed: signedDayList
          .filter((item) => item.type === 1)
          .some((item) => item.date === dayItem.date),
        repairSigned: signedDayList
          .filter((item) => item.type === 2)
          .some((item) => item.date === dayItem.date),
      };
    });
    this.setData({
      dayList,
      signedDayList,
      todayIsSigned: dayList.find(
        (i) => i.date === dayjs().format("YYYY-MM-DD")
      ).signed,
    });
  },
  /**
   * 获取已签到日期
   * @returns {Promise<*>}
   */
  async querySignInDate() {
    return await wx.cloud.callFunction({
      name: "signIn",
      config: {
        env: this.data.envId,
      },
      data: {
        type: "querySignInDate",
      },
    });
  },
  /**
   * 签到
   * @returns {Promise<void>}
   */
  async handleSignIn() {
    wx.showLoading({
      title: "loading",
    });
    try {
      // 订阅签到提醒消息
      await this.subscribeMessage();
      // 1.查询用户是否存在
      if (this.data.userInfo) {
        //    1.1 存在，进行签到流程
        // await this.submitSignIn();
      } else {
        //    1.2不存在
        await this.signInWithNotFindUserInfo();
      }
    } catch (e) {
      console.log(e);
    } finally {
      wx.hideLoading();
    }
  },
  /**
   * 新用户签到
   * @returns {Promise<void>}
   */
  async signInWithNotFindUserInfo() {
    //        1.2.1 用户授权获取用户信息；
    const user = await this.getUserProfile();
    //        1.2.2 保存用户信息；
    if (user) {
      user.point = 0;
      this.setData({
        userInfo: user,
      });
      await wx.cloud.callFunction({
        name: "userInfo",
        config: {
          env: this.data.envId,
        },
        data: {
          type: "insert",
          data: user,
        },
      });
      //        1.2.3 进行签到流程
      await this.submitSignIn();
    }
  },
  /**
   * 获取今日可获得多少积分
   * @returns {number}
   */
  getTodayPoint() {
    let point = 0;
    const preThreeDays = [1, 2, 3].map((item) =>
      dayjs().startOf("days").subtract(item, "days").format("YYYY-MM-DD")
    );
    // 连续签到3天
    if (preThreeDays.every((item) => this.data.signedDayList.includes(item))) {
      return 20;
    }
    // 连续签到2天
    if (
      preThreeDays
        .slice(0, 1)
        .every((item) => this.data.signedDayList.includes(item))
    ) {
      return 15;
    }
    // 连续签到1天
    if (this.data.signedDayList.includes(preThreeDays[0])) {
      return 10;
    }

    // 昨天未签到
    if (!this.data.signedDayList.includes(preThreeDays[0])) {
      return 5;
    }
    return point;
  },
  async submitSignIn() {
    const point = this.getTodayPoint();
    try {
      const signInInfo = await wx.cloud.callFunction({
        name: "signIn",
        config: {
          env: this.data.envId,
        },
        data: {
          type: "insert",
          data: {
            point,
          },
        },
      });
      const { status, errMsg, data } = signInInfo.result;
      if (status === 200 && !errMsg) {
        let { signedDayList, userInfo } = this.data;
        signedDayList.push({
          date: dayjs().format("YYYY-MM-DD"),
          type: 1,
        });
        userInfo.point += data.todayPoint;
        this.setData({
          showSuccessModal: true,
          tomorrowPoint: data.tomorrowPoint,
          todayPoint: data.todayPoint,
          signedDayList,
          userInfo,
        });
        this.handleDateListBySignedDays(signedDayList);
      }
    } catch (e) {
      console.log(e);
    }
  },
  /**
   * 用户授权
   * @returns {Promise<unknown>}
   */
  getUserProfile() {
    return new Promise((resolve) => {
      wx.getUserProfile({
        desc: "用于完善会员资料",
        success: (res) => {
          resolve(res.userInfo);
        },
      });
    });
  },
});
