/* eslint-disable max-len */
const { URL } = require('url');
const HttpsProxyAgent = require('https-proxy-agent');
const querystring = require('querystring');
const ezmesure = require('./app/ezmesure');
const sushi = require('./app/sushi');

const httpsAgent = process.env.https_proxy && new HttpsProxyAgent(process.env.https_proxy);

module.exports = {
  getAll: async (options) => {
    const query = {
      method: 'GET',
      url: '/institutions',
    };

    if (options) {
      if (options.timeout) { query.timeout = options.timeout; }
      if (options.token) {
        query.headers = {
          Authorization: `Bearer ${options.token}`,
        };
      }
    }

    return ezmesure(query);
  },

  getSushi: async (institutionId) => ezmesure({
    method: 'GET',
    url: `/institutions/${institutionId}/sushi`,
  }),

  deleteSushi: async (ids) => ezmesure({
    method: 'POST',
    url: '/sushi/batch_delete',
    data: { ids },
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

    credential.sushiURL = credential.sushiURL.endsWith('/reports') ? credential.sushiURL.slice(0, -8) : credential.sushiURL;
    credential.sushiURL = credential.sushiURL.endsWith('/') ? credential.sushiURL.slice(0, -1) : credential.sushiURL;

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

    const response = await ezmesure({
      method: 'POST',
      url: '/sushi',
      data,
    });

    if (response.status !== 201) {
      return Promise.reject(new Error(`${credential.vendor} import failed`));
    }
    return Promise.resolve(`${credential.vendor} imported`);
  },

  sushiTest: async (institution) => {
    function sendError(response, error) {
      return Promise.reject(new Error(JSON.stringify({
        status: 'error',
        error,
        took: response ? response.headers['request-duration'] : null,
      })));
    }

    const sushiUrl = new URL(institution.sushiUrl).pathname;

    if (sushiUrl.includes('/api/soap/analytics/SushiService')) {
      return sendError(null, 'Invalid endpoint url');
    }

    const queryParams = {};

    institution.sushiUrl = institution.sushiUrl.endsWith('/') ? institution.sushiUrl.slice(0, -1) : institution.sushiUrl;

    if (institution.params && institution.params.length) {
      institution.params.forEach((param) => {
        queryParams[param.name] = param.value;
      });
    }

    let response;
    try {
      response = await sushi.get(`${institution.sushiUrl}/reports`, {
        httpsAgent: (institution.sushiUrl.startsWith('https') && httpsAgent) ? httpsAgent : undefined,
        proxy: (institution.sushiUrl.startsWith('https') && httpsAgent) ? false : undefined,
        params: {
          requestor_id: institution.requestorId || null,
          customer_id: institution.customerId || null,
          api_key: institution.apiKey || null,
          ...queryParams,
        },
      });
    } catch (error) {
      if (error?.status === 404) {
        return sendError(error.response, error.data.error);
      }
      if ([401, 403, 404, 500].includes(error?.response?.status)) {
        return sendError(error.response, `[Error#${error.response.status}] ${error.response.statusText}`);
      }

      // For elsevier
      if (error?.response?.data?.Exception) {
        return sendError(error.response, `[Error#${error.response.data.Exception.Code}] ${error.response.data.Exception.Message}`);
      }
      if (error?.response?.data?.Severity) {
        return sendError(error.response, `[Error#${error.response.data.Code}] ${error.response.data.Message}`);
      }

      return sendError(error.response, `[${error.code}] ${error.message}`);
    }

    if (!response) {
      return sendError(response, 'Endpoint doesn\'t respond');
    }

    if (Array.isArray(response)) {
      const exceptions = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const res of response) {
        exceptions.push(res.Message);
      }
      return sendError(response, exceptions);
    }

    if (response?.data?.Exception) {
      return sendError(response, `[Error#${response.data.Exception.Code}] ${response.data.Exception.Message}`);
    }
    if (response?.data?.Severity) {
      return sendError(response, `[Error#${response.data.Code}] ${response.data.Message}`);
    }

    return Promise.resolve({
      status: 'success',
      took: response.headers['request-duration'],
    });
  },

  getReport: async (sushiURL, opts) => {
    // https://onlinelibrary.wiley.com/reports/tr?requestor_id=<REQUESTOR_ID>&customer_id=<CUSTOMER_ID>&begin_date=2019-01-01&end_date=2019-12-01

    let url = `${sushiURL}/reports`;
    if (opts.report) {
      url = `${url}/${opts.report}?`;
      if (opts.report === 'tr') {
        url = `${url}Attributes_To_Show=Access_Type|Access_Method|Section_Type|Data_Type|YOP&Access_Type=Controlled|OA_Gold&Section_Type=Article|Book|Chapter|Other|Section`;
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
