'use strict';

const Vinyl = require('vinyl');
const through = require('./utils/through');
const PluginError = require('plugin-error');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const fileExist = require('./file-exist');

/**
 * This plugin parses all asciidoc files to build a Rss XML descriptor
 */
module.exports = function (options, filename) {

  const pagesPath = path.resolve(__dirname, options.path, options.metadata.rss);
  if(!fileExist(pagesPath)){
    throw new PluginError('convert-to-rss', `Missing metadata page with all articles descriptions. Define this file. The default path is ${options.metadata.rss}`);
  }
  const rssMetadata =  JSON.parse(fs.readFileSync(pagesPath, 'utf8'));

  if (!filename) throw new PluginError('convert-to-rss', 'Missing target filename for asciidoctor-rss');

  let xml= '';

  function iterateOnStream(file) {
    const content = file
      .map(metadata => `
          <item>
            <link>${rssMetadata.articlesurl}/${metadata.dir}/${metadata.filename}.html</link>
            <title>${metadata.doctitle}</title>
            <description>${metadata.teaser}</description>
            <pubDate>${moment(metadata.revdate, 'YYYY-mm-DD').format('DD/mm/YYYY')}</pubDate>
            <enclosure url="${rssMetadata.articlesimgurl}/${metadata.dir}/${metadata.imgteaser}"/>
          </item>
        `)
      .reduce((a, b) => a + b);

    xml = `
        <rss xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
            <channel>
                <title>${rssMetadata.title}</title>
                <description>${rssMetadata.description}</description>
                <copyright>${rssMetadata.copyright}</copyright>
                <link>${rssMetadata.articlesurl}</link>
                <atom:link href="${rssMetadata.rssurl}" rel="self" type="application/rss+xml"/>
                <pubDate>${moment().format('YYYY-MM-DD hh:mm:ss')}</pubDate>
                <image>
                  <url>${rssMetadata.logourl}</url>
                  <title>${rssMetadata.shorttile}</title>
                  <link>${rssMetadata.articlesurl}</link>
                </image>
                ${content}
            </channel>
        </rss>`;
    }

  function endStream() {
    let target = new Vinyl({ path: filename, contents: Buffer.from(xml)});
    this.emit('data', target);
    this.emit('end');
  }

  return through(iterateOnStream, endStream);
};
