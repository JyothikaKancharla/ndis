// Manual mock for src/api/api.js — prevents Jest from loading real axios (ESM)
const api = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

module.exports = api;
module.exports.default = api;
