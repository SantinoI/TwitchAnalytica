const config = require('./config/main');

// const { v4: uuidv4 } = require('uuid');
const superagent = require('superagent');
const async = require('async');
const express = require('express');

const AWS = require("aws-sdk");
AWS.config.update(config.aws);

const dynamodb = new AWS.DynamoDB.DocumentClient();

const app = express();
const router = express.Router();

const jwt = require('jsonwebtoken');
const verifytoken = require('./middleware/verifytoken');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const logger = require('morgan');
app.use(logger('dev'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use('/api/v1', router);
app.set('secretforjwt', config.secret);

router.get("/", (req, res, next) => {
  res.status(201).json({ "message": "Service 'history' running " + new Date(), "error": null, "success": true })
})

var port = config.port;
var server = app.listen(port, function () {
    console.log("🌐 Express 'history' server listening on port: " + port);
});