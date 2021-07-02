const dayjs = require('./dayjs');

// pages/sign_in/sign_in.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dayList: [],
    signedDayList: [
      { date: '2021-06-01', type: 1 },
      { date: '2021-06-02', type: 2 },
      { date: '2021-06-03', type: 1 },
      { date: '2021-06-04', type: 2 },
      { date: '2021-06-05', type: 1 },
      { date: '2021-06-06', type: 1 },
      { date: '2021-06-07', type: 1 },
      { date: '2021-06-08', type: 1 },
      { date: '2021-06-09', type: 1 },
      { date: '2021-06-10', type: 1 },
      { date: '2021-06-11', type: 1 },
      { date: '2021-06-12', type: 1 },
      { date: '2021-06-13', type: 1 },
    ],
    showMonth:dayjs().format('M')
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const dayList = [];
    const startDate = dayjs().startOf('months').startOf('weeks').unix();
    const endDate = dayjs().endOf('months').endOf('weeks').unix();
    for (let i = startDate; i <= endDate; i += 24 * 60 * 60) {
      const date = dayjs(i * 1000).format('YYYY-MM-DD');
      dayList.push({
        day: dayjs(i * 1000).format('DD'),
        date,
        signed: this.data.signedDayList.filter(item=>item.type === 1).some(item => item.date === date),
        repairSigned: this.data.signedDayList.filter(item=>item.type === 2).some(item => item.date === date),
        isNowDate: i === dayjs().startOf('days').unix(),
        notCurrentMonth: dayjs(i * 1000).month() !== dayjs().month(),
      });
    }

    //初始化加载日历
    this.setData({
      dayList,
    });
  },
});