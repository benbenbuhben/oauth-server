'use strict';

var path = require('path');
var fs = require('fs');
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
var https = require('https');

import authRouter from './auth/router.js';

import errorHandler from './middleware/error.js';
import notFound from './middleware/404.js';

var certOptions = {
  key: fs.readFileSync(path.resolve('./server.key')),
  cert: fs.readFileSync(path.resolve('./server.crt'))
};

let app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); // => req.body
app.use(express.urlencoded({
  extended: true
})); // req.body => from a form's key value pairs

app.use(authRouter);

app.use(notFound);
app.use(errorHandler);

let server = false;

module.exports = {
  start: (port) => {
    if (!server) {
      // server = app.listen(port, (err) => {
      server = https.createServer(certOptions, app).listen(port, (err) => {
        if (err) {
          throw err;
        }
        console.log('Server running on', port);
      });
    } else {
      console.log('Server is already running');
    }
  },

  stop: () => {
    server.close(() => {
      console.log('Server is now off');
    });
  },
};