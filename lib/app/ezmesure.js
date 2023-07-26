const axios = require('axios');
const c = require('./config');
const { name, version } = require('../../package.json');
const { watch } = require('./config');

c.loadEnv();

watch(['ezmesure.baseUrl']);

const instance = axios.create({
  timeout: c.config.timeout || 3000,
  baseURL: c.config.ezmesure.baseUrl,
  headers: {
    Authorization: `Bearer ${c.config.ezmesure.token}`,
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
