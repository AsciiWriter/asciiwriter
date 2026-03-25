'use strict';
// tag::require[]
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const website = require('./index')({path: '../'});
// end::require[]


// tag::hbs-partials[]
const HANDLEBARS_PARTIALS = [
  {key: '_page_header', path: 'src/templates/_page_header.hbs'},
  {key: '_page_footer', path: 'src/templates/_page_footer.hbs'},
  {key: '_html_footer', path: 'src/templates/_html_footer.hbs'},
  {key: '_html_header', path: 'src/templates/_html_header.hbs'},
  {key: '_html_header_url', path: 'src/templates/_html_header_url.hbs'},
];
// end::hbs-partials[]

// tag::articles-indexing[]
gulp.task('articles-indexing', () =>
  gulp.src('src/articles/**/*.adoc')
      .pipe(website.readAsciidoc())
      .pipe(website.convertToHtml())
      .pipe(website.convertToJson('articlesindex.json'))
      .pipe(gulp.dest('build/.tmp'))
);
// end::articles-indexing[]

// tag::articles-rss[]
gulp.task('articles-rss', () =>
  gulp.src('build/.tmp/articlesindex.json')
      .pipe(website.readIndex())
      .pipe(website.convertToRss('articles.xml'))
      .pipe(gulp.dest('build/docs/rss'))
);
// end::articles-rss[]

// tag::articles-list[]
gulp.task('articles-list', () =>
  gulp.src('build/.tmp/articlesindex.json')
      .pipe(website.readIndex())
      .pipe(website.convertToArticlesList('src/templates/articles.hbs', HANDLEBARS_PARTIALS, 'articles.html', 1))
      .pipe(gulp.dest('build/docs'))
);
// end::articles-list[]

// tag::articles-page[]
gulp.task('articles-page', (cb) => {
  gulp.src('src/articles/**/*.adoc')
      .pipe(website.readAsciidoc())
      .pipe(website.convertToHtml())
      .pipe(website.highlightCode({selector: 'pre.highlight code'}))
      .pipe(
        website.convertToArticlesPage('src/templates/articles.hbs', HANDLEBARS_PARTIALS, 'build/.tmp/articlesindex.json'))
      .pipe(gulp.dest('build/docs/articles'))
      .on('end', () => cb())
});
// end::articles-page[]

gulp.task('articles', gulp.series('articles-indexing', 'articles-page', 'articles-list', 'articles-rss'), cb => cb());

// tag::html-task[]
// tag::html-indexing[]
gulp.task('html-indexing', () =>
  gulp.src(`src/html/**/*.html`)
      .pipe(website.readHtml())
      .pipe(website.convertToJson('pageindex.json'))
      .pipe(gulp.dest('build/.tmp')));
// end::html-indexing[]
// tag::html-template[]
gulp.task('html-template', () =>
  gulp.src(`src/html/**/*.html`)
      .pipe(website.readHtml())
      .pipe(website.applyTemplate(`src/templates/articles.hbs`, HANDLEBARS_PARTIALS))
      .pipe(gulp.dest('build/.tmp'))
      .pipe(gulp.dest('build/docs')));
// end::html-template[]
gulp.task('html', gulp.parallel('html-indexing', 'html-template'));
// end::html-task[]

// tag::404page[]
gulp.task('404page', () =>
  gulp.src(`src/404/404.html`)
      .pipe(gulp.dest('build/.tmp'))
      .pipe(gulp.dest('build/docs')));
// end::404page[]

// tag::img[]
gulp.task('img', () =>
  gulp.src(`src/img/**/*`)
      .pipe(gulp.dest('build/.tmp/img'))
      .pipe(gulp.dest('build/docs/img')));
// end::img[]

// tag::sass[]
gulp.task('sass', function () {
  return gulp.src(`src/sass/**/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('src/css'));
});
// end::sass[]

// tag::css[]
gulp.task('css', () =>
  gulp.src(`src/css/**/*`)
      .pipe(gulp.dest('build/.tmp/css'))
      .pipe(gulp.dest('build/docs/css')));
// end::css[]

gulp.task('js', () =>
  gulp.src(`src/js/**/*`)
      .pipe(gulp.dest('build/.tmp/js'))
      .pipe(gulp.dest('build/docs/js')));

gulp.task('assets', gulp.parallel('404page', 'img', 'css', 'js'));

// tag::sitemap[]
gulp.task('sitemap', () =>
  gulp.src(['build/.tmp/articlesindex.json', 'build/.tmp/pageindex.json'])
      .pipe(website.readIndex())
      .pipe(website.convertToSitemap())
      .pipe(gulp.dest('build/docs'))
);
// end::sitemap[]

// tag::check[]
gulp.task('check', () =>
  gulp.src([ // Check for articles index
             'build/.tmp/articlesindex.json',
             // Check for page index
             'build/.tmp/pageindex.json',
             // Check for RSS file
             'build/docs/rss/articles.xml',
             // Check for site map
             'build/docs/sitemap.xml',
             // Check for HTML index page
             'build/docs/index.html',
             // Check for 404 HTML page
             'build/docs/404.html',
             // Check for pure template page
             'build/docs/articles.html'
           ])
      .pipe(website.extVerifyFiles())
      .pipe(gulp.dest('build/check'))
);
// end::check[]

// tag::default[]
gulp.task('default', gulp.series('assets', 'articles', 'html', 'sitemap', 'check'), cb => cb());
// end::default[]
