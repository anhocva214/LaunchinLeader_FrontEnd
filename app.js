var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var staticCache = require('express-static-cache');
var upload = require('multer')();


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');
var accountRouter = require('./routes/account');
var courseRouter = require('./routes/course');





var cors = require('cors');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(upload.array());

app.use(express.static(path.join(__dirname, 'public'), 
{
  etag: true, // Just being explicit about the default.
  lastModified: true,  // Just being explicit about the default.
  setHeaders: (res, path) => {
    if (path.endsWith('.png')  || path.endsWith('.jpg') ) {
      // All of the project's HTML files end in .html
      res.setHeader('Cache-Control', 'max-age=31536000');
    }
  }
}
));
 
// app.use(staticCache(path.join(__dirname, 'public'), {
//   maxAge: 365 * 24 * 60 * 60
// }))

app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/account', accountRouter);
app.use('/course', courseRouter);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  // next(err)
});


module.exports = app;
