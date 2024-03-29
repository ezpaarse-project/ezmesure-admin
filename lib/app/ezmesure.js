const axios = require('axios');
const { config } = require('./config');
const { name, version } = require('../../package.json');
const { watch } = require('./config');

watch(['ezmesure.baseUrl']);

const instance = axios.create({
  timeout: config.timeout || 3000,
  baseURL: config.ezmesure.baseUrl,
  headers: {
    Authorization: `Bearer ${config.ezmesure.token}`,
    'User-Agent': `${name}-${version}`,
  },
});

instance.interceptors.response.use((response) => response, (error) => {
  if (error?.response?.status === 401 || error?.response?.statusCode === 401) {
    watch(['ezmesure.token']);
  }
  return Promise.reject(error);
});

module.exports = instance;
