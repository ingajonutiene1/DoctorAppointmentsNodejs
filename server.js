var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan  = require('morgan');
var fs = require('fs')
var path = require('path')
var rfs = require('rotating-file-stream')

var accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'log')
})

app.listen(8081);
app.use(morgan('combined', { stream: accessLogStream }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function(req, res, next) {
  res.set('Access-Control-Allow-Origin', 'http://localhost:8080');

  res.set('Access-Control-Allow-Credentials', true);
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  if ('OPTIONS' == req.method) return res.send(200);
  next();
});

/* Routes */
var routes = {};
routes.appointments = require('./api/appointments.js');

app.post('/appointment', routes.appointments.create);
app.get('/appointments', routes.appointments.getAll);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

console.log('port 8081');
