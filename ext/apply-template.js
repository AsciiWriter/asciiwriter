'use strict';

const map = require('map-stream');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const fileExist = require('./file-exist');

/**
 * This function receives a stream with different medatadata on asciidoc files or static html files. For example
 *
 * <pre>
 *  gulp.src("src/articles/*.adoc")
 *      .pipe(asciidoctorRead(modeDev))
 *      .pipe(r())
 *      .pipe(applyTemplate('src/templates/articles.hbs', HANDLEBARS_PARTIALS))
 * </pre>
 *
 * or
 *
 * <pre>
 *  gulp.src("src/articles/*.html`)
 *      .pipe(htmlRead(modeDev))
 *      .pipe(applyTemplate('src/templates/static.hbs', HANDLEBARS_PARTIALS))
 * </pre>
 *
 * The aim is to inject the data read in a handlebars template to generate a static file
 *
 * @param handlebarsTemplateFile
 * @param partials used in the handlebarsTemplateFile
 * @returns {stream}
 */
module.exports = function (options, handlebarsTemplateFile, partials) {

  const handlebarsTemplatePath = path.resolve(__dirname, options.path, handlebarsTemplateFile);
  if (!fileExist(handlebarsTemplatePath)) {
    throw new PluginError('apply-template',
                          `handlebars template ${handlebarsTemplatePath} is required`);
  }

  if (partials) {
    partials.forEach(partial => handlebars.registerPartial(partial.key, fs.readFileSync(
      path.resolve(__dirname, options.path, partial.path), 'utf8')));
  }
  const handlebarsTemplate = handlebars.compile(fs.readFileSync(handlebarsTemplatePath, 'utf8'));

  return map(async (file, next) => {
    file.contents = Buffer.from(handlebarsTemplate(file.templateModel));
    next(null, file);
    return [3 /*return*/];
  });
};

