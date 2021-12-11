var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var session = require('express-session')

var usersRouter = require('./routes/users');
var restaurantsRouter = require('./routes/restaurants');
var itemsRouter = require('./routes/items');
var reviewsRouter = require('./routes/reviews');

var app = express();

app.use(cors({credentials: true, origin: true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'This is a secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    sameSite: 'none'
  }
}));

app.use('/users', usersRouter);
app.use('/restaurants', restaurantsRouter);
app.use('/items', itemsRouter);
app.use('/reviews', reviewsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // send error status and message back to client
  res.status(err.status || 500).json({
    message: err.message
  });
});

module.exports = app;
