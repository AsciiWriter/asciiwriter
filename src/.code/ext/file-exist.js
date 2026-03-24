'use strict';

const fs = require('fs-extra');

module.exports = function (filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (e) {
    return false;
  }
};

