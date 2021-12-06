const { src, dest, parallel, series, watch } = require("gulp");
const cleanCSS = require("gulp-clean-css");
const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const fileInclude = require("gulp-file-include");
const imagemin = require("gulp-imagemin");
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");
const newer = require("gulp-newer");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const gulpif = require("gulp-if");
const notify = require("gulp-notify");
const browserSync = require("browser-sync").create();
const webpack = require("webpack-stream");

let isProd = false;
const toProd = done => {
  isProd = true;
  done();
};

let webpackConfig = {
  output: { filename: "bundle.js" },
  mode: isProd ? "production" : "development",
  target: "browserslist:browserslist config, not maintained node versions",
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: ["/node_modules", /\bcore-js\b/, /\bwebpack\/buildin\b/],
        options: {
          presets: ["@babel/preset-env"],
          plugins: ["@babel/plugin-transform-runtime"],
        },
      },
    ],
  },
  devtool: "eval-source-map",
};

const clean = () => {
  return del(["app/**"]);
};

const styles = () => {
  return src(["./src/scss/**/*.scss", "!src/scss/vendors/**"])
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass().on("error", notify.onError()))
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(gulpif(isProd, cleanCSS({ level: 2 })))
    .pipe(gulpif(!isProd, sourcemaps.write(".")))
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
};

const vendors = () => {
  return src(["src/vendors/**"])
    .pipe(dest("app/vendors/"))
    .pipe(browserSync.stream());
};

const gulpWebpack = () => {
  return src("./src/js/script.js")
    .pipe(webpack(webpackConfig))
    .pipe(dest("app/js/"))
    .pipe(browserSync.stream());
};

const images = () => {
  return (
    src(["./src/img/**", "!./src/img/svg-sprites/**"])
      .pipe(newer("./app/img/"))
      // .pipe(gulpif(isProd, imagemin()))
      .pipe(imagemin())
      .pipe(dest("./app/img/"))
  );
};

const svgSprites = () => {
  return src("./src/img/svg-sprites/**/*.svg")
    .pipe(
      svgSprite({
        mode: {
          // stack: {
          //   sprite: "../sprite.svg", //sprite file name
          // },
          symbol: {
            dest: "./",
            sprite: "./sprite.svg",
          },
        },
      })
    )
    .pipe(dest("./app/img/svg-sprites/"));
};

const fonts = () => {
  return src("./src/fonts/**")
    .pipe(dest("./app/fonts/"))
    .pipe(browserSync.stream());
};

// const svgminify = done => {
//   return src("./src/images/**/*.svg")
//   .pipe(svgmin());
//   done();
// };

const htmlInclude = () => {
  return src(["./src/*.html"])
    .pipe(
      fileInclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest("./app"))
    .pipe(browserSync.stream());
};

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "./app",
    },
  });

  watch("./src/scss/**", styles);
  watch("./src/**/*.html", htmlInclude);
  watch("./src/fonts/**", fonts);
  watch(["./src/img/**", "!./src/img/svg-sprites/**"], images);
  watch("./src/js/**/*.js", gulpWebpack);
  watch("./src/img/svg-sprites/**", svgSprites);
  watch("./src/scss/vendors/**", vendors);
};

// copy webfonts for FontAwesome into your source
exports.copyFontAwesome = () => {
  return src("node_modules/@fortawesome/fontawesome-free/webfonts/*").pipe(
    dest("./src/fonts/webfonts/")
  );
};

exports.default = series(
  clean,
  htmlInclude,
  styles,
  images,
  svgSprites,
  gulpWebpack,
  fonts,
  vendors,
  watchFiles
);

exports.build = series(
  toProd,
  clean,
  htmlInclude,
  styles,
  images,
  svgSprites,
  gulpWebpack,
  vendors,
  fonts
);
