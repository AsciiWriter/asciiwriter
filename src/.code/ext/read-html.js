'use strict';

const map = require('map-stream');
const fs = require('fs-extra');
const PluginError = require('plugin-error');
const moment = require('moment');
const path = require('path');
const fileExist = require('./file-exist');


/**
 * This function is used to read the html files defined in a gulp pipe. 
 * For example
 * <pre>
 *     gulp.src("src/html/*.html").pipe(htmlRead(modeDev));
 * </pre>
 * The function loads all html files and returns a file object with the different metadata
 *
 * @returns {stream}
 */
module.exports = function (options) {

  const pageMetadataPath = path.resolve(__dirname, options.path, options.metadata.html);
  if(!fileExist(pageMetadataPath)){
    throw new PluginError('read-html', `Missing metadata page with all html descriptions. Define this file. The default path is ${options.metadata.html}`);
  }
  const pageMetadata =  JSON.parse(fs.readFileSync(pageMetadataPath, 'utf8'));

  return map((file, next) => {

    const html = fs.readFileSync(file.path, 'utf8');
    file.fileName = file.path.substring(file.path.lastIndexOf(path.sep) + 1, file.path.length);
// tag::no-metadata[]
    if (!pageMetadata[file.fileName]) throw new PluginError('read-html', `Missing index definition for ${file.path} in the build script html-read`);
// end::no-metadata[]
    file.templateModel = {
      keywords: () => pageMetadata[file.fileName].keywords.split(","),
      title: () => pageMetadata[file.fileName].title,
      description: () => pageMetadata[file.fileName].description,
      contents: () => Buffer.from(html),
      gendate: () => moment().format('DD/MM/YYYY'),
      genInstant: () => moment().format('YYYY-MM/DD hh:mm:ss'),
      articles: () => pageMetadata[file.fileName].articles,
      canonicalUrl: () => file.fileName,
      modedev: () => options.modeDev,
    };

    file.indexData =  {
      strdate: moment().format('DD/MM/YYYY'),
      revdate: moment().format('DD/MM/YYYY'),
      doctitle: pageMetadata[file.fileName].title,
      description: pageMetadata[file.fileName].description,
      keywords: pageMetadata[file.fileName].keywords.split(","),
      filename: file.fileName.substring(0, file.fileName.lastIndexOf('.')),
      priority: pageMetadata[file.fileName].priority,
      dir: path.sep
    };

    next(null, file);
  });
};

