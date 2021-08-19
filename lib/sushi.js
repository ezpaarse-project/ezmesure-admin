/* eslint-disable max-len */
const { URL } = require('url');
const HttpsProxyAgent = require('https-proxy-agent');
const ezmesure = require('./app/ezmesure');
const sushi = require('./app/sushi');
const { config, watch } = require('./app/config');

const httpsAgent = process.env.https_proxy && new HttpsProxyAgent(process.env.https_proxy);

watch(['index.depositors']);

module.exports = {
  getAll: () => ezmesure.get('/sushi'),
  getOne: (id) => ezmesure.get(`/sushi/${id}`),
  getPlatforms: () => ezmesure.get('/sushi/platforms.json'),
  delete: (ids) => ezmesure.post('/sushi/batch_delete', { ids }),
  add: (data) => ezmesure.post('/sushi', data),
  update: (sushiId) => ezmesure.patch(`/sushi/${sushiId}`),
  fetch: (sushiId) => ezmesure.post(`/sushi/${sushiId}_fetch`),
  getTasks: (sushiId) => ezmesure.get(`/sushi/${sushiId}/tasks`),
  getReports: (sushiId) => ezmesure.get(`/sushi/${sushiId}/reports`),
  downloadReport: (sushiId) => ezmesure.get(`/sushi/${sushiId}/report.json`),
  import: (sushiId, data) => ezmesure.post(`/sushi/${sushiId}/_import`, data),

  sushiTest: async (institution) => {
    function sendError(response, error) {
      return Promise.reject(new Error(JSON.stringify({
        status: 'error',
        error,
        took: response ? response.headers['request-duration'] : null,
        reports: [],
        credentials: {
          requestor_id: institution.requestorId || null,
          customer_id: institution.customerId || null,
          api_key: institution.apiKey || null,
        },
      })));
    }

    const sushiUrl = new URL(institution.sushiUrl).pathname;

    if (sushiUrl.includes('soap')) {
      return sendError(null, 'Invalid endpoint url');
    }

    const queryParams = {};

    institution.sushiUrl = institution.sushiUrl.endsWith('/') ? institution.sushiUrl.slice(0, -1) : institution.sushiUrl;
    institution.sushiUrl = institution.sushiUrl.endsWith('/reports') ? institution.sushiUrl.slice(0, institution.sushiUrl.length - '/reports'.length) : institution.sushiUrl;

    if (institution.params && institution.params.length) {
      institution.params.forEach((param) => {
        queryParams[param.name] = param.value;
      });
    }

    let response;
    try {
      response = await sushi({
        method: 'GET',
        url: `${institution.sushiUrl}/reports`,
        responseType: 'json',
        timeout: config.timeout,
        params: {
          requestor_id: institution.requestorId || null,
          customer_id: institution.customerId || null,
          api_key: institution.apiKey || null,
          ...queryParams,
        },
        httpsAgent: (institution.sushiUrl.startsWith('https') && httpsAgent) ? httpsAgent : undefined,
        proxy: (institution.sushiUrl.startsWith('https') && httpsAgent) ? false : undefined,
      });
    } catch (error) {
      if (error?.status) {
        return sendError(error.response, `[Error#${error.response.status}] ${error.data.error}`);
      }
      if (error?.response?.status) {
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
      // eslint-disable-next-line
      reports: response.data.map(({ Report_ID }) => Report_ID),
    });
  },
};
