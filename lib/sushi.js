/* eslint-disable max-len */
const config = require('config');
const axios = require('axios');
const querystring = require('querystring');
const { token, ezmesureUrl } = require('config');

const sushi = axios.create({
  timeout: config.timeout || 100000,
  // proxy: config.proxy,
});

module.exports = {
  getSushi: async institutionId => axios({
    method: 'GET',
    url: `${ezmesureUrl}/api/institutions/${institutionId}/sushi`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),

  deleteSushi: async ids => axios({
    method: 'POST',
    url: `${ezmesureUrl}/api/sushi/batch_delete`,
    data: { ids },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),

  addSushi: async (institutionId, credential) => {
    const params = [];

    if (credential.sushiParameters) {
      const query = querystring.parse(credential.sushiParameters);

      if (query.api_key) {
        credential.apiKey = query.api_key;
        delete query.api_key;
      }

      Object.keys(query).forEach((param) => {
        params.push({
          name: param,
          value: query[param] || '',
        });
      });
    }

    const data = {
      institutionId,
      vendor: credential.vendor,
      sushiUrl: credential.sushiURL,
      requestorId: credential.requestorId,
      customerId: credential.customerId,
      apiKey: credential.apiKey,
      package: credential.package,
    };

    if (params.length) {
      data.params = params;
    }

    const response = await axios({
      method: 'POST',
      url: `${ezmesureUrl}/api/sushi`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 201) {
      return Promise.reject(new Error(`${credential.vendor} import failed`));
    }
    return Promise.resolve(`${credential.vendor} imported`);
  },

  getReport: async (sushiURL, opts) => {
    // https://onlinelibrary.wiley.com/reports/tr?requestor_id=valerie.mahut@inist.fr&customer_id=EAL00000148615
    // &begin_date=2019-01-01&end_date=2019-12-01

    let url = `${sushiURL}/reports`;
    if (opts.report) {
      url = `${url}/${opts.report}?`;
      if (opts.report === 'tr') {
        url = `${url}Attributes_To_Show=Access_Type|Access_Method|Section_Type|Data_Type|YOP\
&Access_Type=Controlled|OA_Gold&Section_Type=Article|Book|Chapter|Other|Section`;
        // ATTENTION REQUETE SPECIFIQUE OPENEDITION
        // url = `${url}data_type=Book&granularity=totals`;
      }
    }
    if (opts.requestorId) {
      url = `${url}&requestor_id=${opts.requestorId}`;
    }
    if (opts.customerId) {
      url = `${url}&customer_id=${opts.customerId}`;
    }
    if (opts.sushiParameters) {
      url = `${url}&${opts.sushiParameters}`;
    }
    if (opts.beginDate && opts.endDate) {
      url = `${url}&begin_date=${opts.beginDate}&end_date=${opts.endDate}`;
    }
    if (opts.verbose) { console.log(url); }
    return sushi.get(url);
  },
};
