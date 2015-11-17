/**
 * Created by Nick on 11/4/15.
 */
/**
 * Created by Nick on 10/6/15.
 */
var gulp = require('gulp');
//var uglify = require('gulp-uglify');
//var rename = require('gulp-rename');
//var concat = require('gulp-concat');
//var ts = require('gulp-typescript');
//var sourcemaps = require('gulp-sourcemaps');
//var order = require('gulp-order');

//gulp.task('uglify', function() {
//    return gulp.src('client/*.js')
//        .pipe(uglify())
//        .pipe(rename({
//            extname: '.min.js'
//        }))
//        .pipe(gulp.dest('server/public/assets/scripts/'));
//});

//gulp.task('minify', function(){
//    return gulp.src(['client/*.js'])
//        .pipe(concat('concat.js'))
//        //.pipe(gulp.dest('client/minified'))
//        .pipe(rename('app.min.js'))
//        .pipe(uglify())
//        .pipe(gulp.dest('server/public/assets/scripts/'));
//});

//gulp.task('compTS', function () {
//    var tsResult = gulp.src(['client/*.ts','client/controllers/*.ts'])
//        .pipe(sourcemaps.init())
//        .pipe(ts({
//            sortOutput:true
//        }));
//    return tsResult.js
//        .pipe(order([
//            'client/*.ts',
//            'client/controllers/*.ts'
//        ]))
//        .pipe(concat('concat.js'))
//        //.pipe(sourcemaps.write())
//        .pipe(rename('app.min.js'))
//        .pipe(uglify())
//        .pipe(sourcemaps.write())
//        .pipe(gulp.dest('server/public/assets/scripts/'));
//});


gulp.task('copy',function() {
    return gulp.src([
        'angular/angular.min.js',
        'angular/angular.min.js.map',
        //'bootstrap/dist/css/bootstrap.min.css',
        //'bootstrap/dist/js/bootstrap.min.js',
        'jquery/dist/jquery.min.js',
        'jquery/dist/jquery.min.map',
        'jquery-mobile/dist/jquery.mobile.min.js',
        'jquery-mobile/dist/jquery.mobile.min.css',
        'jquery-mobile/dist/jquery.mobile.min.map',
        'jquery-flipster/dist/jquery.flipster.css',
        'jquery-flipster/dist/jquery.flipster.min.js',
        'font-awesome/css/font-awesome.min.css',
        'font-awesome/fonts/fontawesome-webfont.woff',
        'font-awesome/fonts/fontawesome-webfont.woff2',
        'font-awesome/fonts/fontawesome-webfont.ttf',
        'bootstrap/dist/js/bootstrap.min.js',
        'bootstrap/dist/css/bootstrap.min.css',
        //'angular-route/angular-route.min.js',
        //'angular-animate/angular-animate.min.js',
        'socket.io-client/socket.io.js'
        ],{cwd:'node_modules',base:'node_modules'})
        .pipe(gulp.dest('server/public/vendor'));
});


gulp.task('default', ['copy']);