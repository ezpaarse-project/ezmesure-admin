/* eslint-disable max-len */
const config = require('config');
const axios = require('axios');

const sushi = axios.create({
  timeout: config.timeout || 100000,
  // proxy: config.proxy,
});

module.exports = {
  getReport: async (sushiURL, opts) => {
    // https://onlinelibrary.wiley.com/reports/tr?requestor_id=valerie.mahut@inist.fr&customer_id=EAL00000148615
    // &begin_date=2019-01-01&end_date=2019-12-01


    const url = `${sushiURL}/reports/${opts.report}?requestor_id=${opts.requestorId}\
      &customer_id=${opts.customerId}&begin_date=${opts.beginDate}&end_date=${opts.endDate}\
&Attributes_To_Show=Access_Type|Access_Method|Section_Type|Data_Type|YOP\
&Access_Type=Controlled|OA_Gold&Section_Type=Article|Book|Chapter|Other|Section`;
    return sushi.get(url);
  },
};
