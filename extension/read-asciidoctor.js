'use strict';

const map = require('map-stream');
const asciidoctor = require('../node_modules/asciidoctor.js/dist/node/asciidoctor')();
const moment = require('moment');

const asciidoctorOptions = {
  safe: 'safe',
  doctype: 'article',
  header_footer: false,
  attributes: {
    imagesdir: '/assets/images',
  },
};

/**
 * This function is used to read the asciidoc files defined in a gulp pipe. For example
 * <pre>
 *     gulp.src("src/blog/*.adoc").pipe(asciidoctorRead(modeDev));
 * </pre>
 * The function load all the asciidoc file and return a file object with the different
 * medatada
 *
 * @param modedev
 * @returns {stream}
 */
module.exports = function (options) {

  return map((file, next) => {

    const opts = Object.assign({}, asciidoctorOptions, {});
    opts.attributes = Object.assign({}, opts.attributes);

    const asciidoc = file.contents.toString();
    file.ast = asciidoctor.load(asciidoc, opts);
    file.attributes = file.ast.getAttributes();
    file.attributes.strdate = file.attributes.revdate;

    const filename = file.path.substring(file.path.lastIndexOf("/") + 1, file.path.lastIndexOf("."));

    let dir = ''
    if (file.path.lastIndexOf("blog/") > 0) {
      dir = file.path.substring(file.path.lastIndexOf("blog/") + "blog/".length, file.path.lastIndexOf("/"));
    }
    if (file.path.lastIndexOf("training/") > 0) {
      dir = file.path.substring(file.path.lastIndexOf("training/") + "training/".length, file.path.lastIndexOf("/"));
    }

    // make all model properties accessible through fat-arrow "getters"
    // this way, file.* values can be changed before templating
    file.templateModel = {
      keywords: () => file.attributes.keywords.split(","),
      title: () => file.attributes.doctitle,
      revdate: () => moment(file.attributes.revdate, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      gendate: () => moment().format('DD/MM/YYYY'),
      contents: () => file.contents,
      'github-edit-url': () => file.git.githubEditUrl,
      filename: () => filename,
      dir: () => dir,
      category: () => file.attributes.category,
      teaser: () => file.attributes.teaser,
      imgteaser: () => file.attributes.imgteaser,
      status: () => file.attributes.status,
      modedev: () => options.modeDev,
      canonicalUrl: () => `blog/${dir}/${filename}.html`
    };

    if (file.attributes.status !== 'draft') {
      file.indexData = {
        strdate: file.attributes.strdate,
        revdate: file.attributes.revdate,
        description: file.attributes.description,
        doctitle: file.attributes.doctitle,
        keywords: file.attributes.keywords,
        filename: filename,
        category: file.attributes.category,
        teaser: file.attributes.teaser,
        imgteaser: file.attributes.imgteaser,
        modeDev: options.modeDev,
        blog: true,
        dir: dir
      };
    }

    next(null, file);
  })
};


