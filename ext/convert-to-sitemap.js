'use strict';

const Vinyl = require('vinyl');
const through = require('./utils/through');
const path = require('path');
const fs = require('fs-extra');
const fileExist = require('./file-exist');

/**
 * This plugin parses indexes (articles + pages) to create a sitemap for bot indexing
 */
module.exports = function (options) {

  const pagesPath = path.resolve(__dirname, options.path, options.metadata.sitemap);
  if(!fileExist(pagesPath)){
    throw new PluginError('convert-to-sitemap', `Missing metadata page with all articles descriptions. Define this file. The default path is ${options.metadata.rss}`);
  }
  const siteMetadata =  JSON.parse(fs.readFileSync(pagesPath, 'utf8'));


  let xml= ``;

  function createUrlNode(metadata){
    if(!!metadata.priority && metadata.priority < 0){
      return '';
    }
    if(metadata.articles){
      return `<url>
        <loc>${siteMetadata.url}/articles/${metadata.dir}/${metadata.filename}.html</loc>
        <changefreq>weekly</changefreq>
        <priority>0.3</priority>
        <news:news>
          <news:publication>
              <news:name>${siteMetadata.name}</news:name>
              <news:language>en</news:language>
          </news:publication>
          <news:genres>Articles</news:genres>
          <news:publication_date>${metadata.revdate}</news:publication_date>
          <news:title>${metadata.doctitle}</news:title>
          <news:keywords>${metadata.keywords}</news:keywords>
          <news:stock_tickers>${metadata.category}</news:stock_tickers>
        </news:news>
    </url>`;
    }
    return `<url>
        <loc>${siteMetadata.url}/${metadata.filename}.html</loc>
        <changefreq>weekly</changefreq>
        <priority>${metadata.priority ? metadata.priority : 0.3}</priority>
    </url>`;
  }

  function iterateOnStream(file) {
    xml += file
      .map(metadata => createUrlNode(metadata))
      .reduce((a, b) => a + b);
  }

  function endStream() {
    const fileContent = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
        <url>
          <loc>${siteMetadata.url}/</loc>
          <changefreq>weekly</changefreq>
          <priority>1</priority>
        </url>
        <url>
          <loc>${siteMetadata.url}/articles</loc>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
        <url>
          <loc>${siteMetadata.url}/articles_archive.html</loc>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
        ${xml}
      </urlset>`;

    let target = new Vinyl({ path: 'sitemap.xml',  contents: Buffer.from(fileContent)});
    this.emit('data', target);
    this.emit('end');
  }

  return through(iterateOnStream, endStream);
};
