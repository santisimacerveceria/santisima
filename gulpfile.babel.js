/**
 * Created by alexruzzarin on 10/24/15.
 */
import gulp from 'gulp';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import david from 'gulp-david';
import eslint from 'gulp-eslint';
import htmlmin from 'gulp-htmlmin';
import onlyif from 'gulp-if';
import minifyCss from 'gulp-minify-css';
import rename from 'gulp-rename';
import responsive from 'gulp-responsive';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import svgmin from 'gulp-svgmin';
import svgSprite from 'gulp-svg-sprite';
import svg2png from 'gulp-svg2png';
import uglify from 'gulp-uglify';
import vinyl from 'vinyl';
import yargs from 'yargs';
import browserSync from 'browser-sync';

const source = {
    package: './package.json',
    base: './src',
    js: ['src/scripts/**/*.js'],
    html: ['src/*.html'],
    stylesPath: ['node_modules/foundation-sites/scss'],
    styles: ['src/styles/*.scss'],
    images: ['src/images/**/*.*', '!src/images/favicon/**/*.*'],
    staticImages: ['src/images/favicon/**/*.*'],
    icons: ['src/icons/svg/*.svg'],
    staticFiles: ['src/browserconfig.xml', 'src/favicon.ico', 'src/CNAME'],
};

const production = yargs.argv.production;

gulp.task('pre', () => {
    return gulp.src(source.package)
        .pipe(david())
        .pipe(david.reporter);
});

gulp.task('js', () => {
    return gulp.src(source.js, {base: source.base})
        .pipe(eslint())
        .pipe(onlyif(!production, sourcemaps.init()))
        .pipe(babel())
        .pipe(onlyif(production, uglify()))
        .pipe(onlyif(!production, sourcemaps.write()))
        .pipe(gulp.dest('dist'))
        .pipe(onlyif(!production, browserSync.reload({stream: true})));
});

gulp.task('html', () => {
    return gulp.src(source.html, {base: source.base})
        .pipe(onlyif(production, htmlmin({collapseWhitespace: true})))
        .pipe(gulp.dest('dist'))
        .pipe(onlyif(!production, browserSync.reload({stream: true})));
});

gulp.task('icons-svg', () => {
    const options = {
        shape: {
            spacing: {
                padding: 5,
            },
        },
        mode: {
            css: {
                dest: './',
                layout: 'diagonal',
                sprite: 'sprite.svg',
                bust: false,
                render: {
                    scss: {
                        dest: '_sprite.scss',
                        template: 'src/icons/sprite-template.scss_tpl',
                    },
                },
            },
        },
        variables: {
            mapname: 'icons',
        },
    };
    return gulp.src(source.icons)
        .pipe(svgmin())
        .pipe(svgSprite(options))
        .pipe(gulp.dest('temp'));
});

gulp.task('icons-png', ['icons-svg'], () => {
    return gulp.src('./temp/sprite.svg')
        .pipe(svg2png())
        .pipe(gulp.dest('temp'));
});

gulp.task('icons', ['icons-png'], () => {
    return gulp.src('./temp/sprite.*')
        .pipe(gulp.dest('./dist/images'));
});

gulp.task('css', ['icons'], () => {
    return gulp.src(source.styles, {base: source.base})
        .pipe(onlyif(!production, sourcemaps.init()))
        .pipe(sass({
            includePaths: source.stylesPath
        }).on('error', sass.logError))
        .pipe(onlyif(production, minifyCss()))
        .pipe(onlyif(!production, sourcemaps.write()))
        .pipe(gulp.dest('dist'))
        .pipe(onlyif(!production, browserSync.stream()));
});

gulp.task('images', () => {
    const config = {
        '**/logo.jpg': [
            {
                width: 320,
                withoutEnlargement: true,
                rename: {
                    suffix: '-small'
                }
            },
            {
                width: 512,
                withoutEnlargement: true,
                rename: {
                    suffix: '-medium'
                }
            },
            {
                width: 720,
                withoutEnlargement: true,
                rename: {
                    suffix: '-large'
                }
            },
            {
                width: 960,
                withoutEnlargement: false,
                rename: {
                    suffix: '-xlarge'
                }
            }
        ],
        '**/background/bg-*.jpg': [
            {
                width: 640,
                progressive: true,
                rename: {
                    suffix: '-small'
                }
            },
            {
                width: 1024,
                progressive: true,
                rename: {
                    suffix: '-medium'
                }
            },
            {
                width: 1440,
                progressive: true,
                rename: {
                    suffix: '-large'
                }
            },
            {
                width: 1920,
                progressive: true,
                rename: {
                    suffix: '-xlarge'
                }
            }
        ],
    };
    const options = {
        errorOnEnlargement: true,
    };
    return gulp.src(source.images, {base: source.base})
        .pipe(responsive(config, options))
        .pipe(gulp.dest('dist'))
        .pipe(onlyif(!production, browserSync.reload({stream: true})));
});

gulp.task('staticImages', () => {
    return gulp.src(source.staticImages, {base: source.base})
        .pipe(gulp.dest('dist'))
        .pipe(onlyif(!production, browserSync.reload({stream: true})));
});

gulp.task('staticFiles', () => {
    return gulp.src(source.staticFiles, {base: source.base})
        .pipe(gulp.dest('dist'))
        .pipe(onlyif(!production, browserSync.reload({stream: true})));
});

gulp.task('watch', ['default'], ()=> {
    browserSync.init({
        server: './dist',
    });

    gulp.watch(source.js, ['js']);
    gulp.watch(source.html, ['html']);
    gulp.watch(source.styles, ['css']);
    gulp.watch(source.images, ['images']);
    gulp.watch(source.staticImages, ['staticImages']);
    gulp.watch(source.staticFiles, ['staticFiles']);
});

gulp.task('default', ['pre', 'html', 'js', 'css', 'images', 'staticImages', 'staticFiles']);