'use strict';

const PluginError = require('plugin-error');
const handlebars = require('handlebars');
const fs = require('fs-extra');
const path = require('path');
const map = require('map-stream');

/**
 * This plugin is used to read the articles index and generate current, previous and next posts
 */
module.exports = (options, handlebarsTemplateFile, partials, articlesIndexFile) => {

  if (!handlebarsTemplateFile) throw new PluginError('convert-to-articles-page', 'Missing source handlebarsTemplateFile for convert-to-articles-page');
  if (!articlesIndexFile) throw new PluginError('convert-to-articles-page', 'Missing source articlesIndexFile for convert-to-articles-page');
  if (!partials) throw new PluginError('convert-to-articles-page', 'Missing source partials for convert-to-articles-page');

  partials.forEach(partial => handlebars.registerPartial(partial.key, fs.readFileSync(path.resolve(__dirname, options.path, partial.path), 'utf8')));
  const handlebarsTemplate = handlebars.compile(fs.readFileSync(path.resolve(__dirname, options.path, handlebarsTemplateFile), 'utf8'));

  const articlesIndexPath = path.resolve(__dirname, options.path, articlesIndexFile);
  const articlesIndex = JSON.parse(fs.readFileSync(articlesIndexPath, 'utf8'));

  return map((file, next) => {
    // We need to find the previous articles post, the current and the next
    let previousPost;
    let nextPost;

    articlesIndex
      .sort((a, b) => (a.strdate < b.strdate ? 1 : (a.strdate > b.strdate ? -1 : 0)))
      .forEach((elt, index, array) => {
        if (elt.filename === file.templateModel.filename()) {

          nextPost = index > 0 ? array[index - 1] : undefined;
          previousPost = index < array.length ? array[index + 1] : undefined;
        }
      });

    if (previousPost) {
      file.templateModel.previous = {
        dir: previousPost.dir,
        filename: previousPost.filename,
        doctitle: previousPost.doctitle
      };
    }
    if (nextPost) {
      file.templateModel.next = {
        dir: nextPost.dir,
        filename: nextPost.filename,
        doctitle: nextPost.doctitle
      };
    }

    const content = handlebarsTemplate(file.templateModel)
      .replace('<html><head></head><body>', '')
      .replace('</body>', '')
      .replace('</html>', '');

    file.templateModel.contents = file.contents.toString();
    file.contents = Buffer.from(content);

    next(null, file);
  });
};






