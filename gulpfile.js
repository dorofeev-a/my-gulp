const { src, dest, parallel, series, watch } = require("gulp");
const cleanCSS = require("gulp-clean-css");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const fileInclude = require("gulp-file-include");
const imagemin = require("gulp-imagemin");
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");
const newer = require("gulp-newer");
const babel = require("gulp-babel");
const terser = require("gulp-terser");
const concat = require("gulp-concat");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const gulpif = require("gulp-if");
const notify = require("gulp-notify");
const browserSync = require("browser-sync").create();

let isProd = false;
const toProd = done => {
  isProd = true;
  done();
};

const clean = () => {
  return del(["app/*"]);
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
    .pipe(src("src/scss/vendors/**"))
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
};

const scripts = () => {
  return src(["src/js/**/*.js", "!src/js/vendors/**"])
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(concat("app.min.js"))
    .pipe(gulpif(isProd, terser()))
    .pipe(gulpif(!isProd, sourcemaps.write(".")))

    .pipe(src("src/js/vendors/**"))
    .pipe(dest("app/js/"))
    .pipe(browserSync.stream());
};

const images = () => {
  return (
    src(["./src/img/**/*", "!./src/img/svg-sprites/**.svg"])
      .pipe(newer("./app/img/"))
      // .pipe(gulpif(isProd, imagemin()))
      .pipe(imagemin())
      .pipe(dest("./app/img/"))
  );
};

const svgSprites = () => {
  return src("./src/img/svg-sprites/*.svg")
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
  return src("./src/fonts/**/*").pipe(dest("./app/fonts/"));
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
        prefix: "@",
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
  watch("./src/*.html", htmlInclude);
  watch(".src/fonts/**/*", fonts);
  watch(["./src/img/**/*", "!./src/img/svg/**"], images);
  watch("./src/js/**", scripts);
  watch("./src/img/svg-sprites/**.svg", svgSprites);
};

exports.default = series(
  clean,
  htmlInclude,
  styles,
  images,
  svgSprites,
  scripts,
  fonts,
  watchFiles
);

exports.build = series(
  toProd,
  clean,
  htmlInclude,
  styles,
  images,
  svgSprites,
  scripts,
  fonts
);
