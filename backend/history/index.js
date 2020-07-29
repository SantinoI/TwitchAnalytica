const config = require('./config/main');

const express = require('express');
const cors = require('cors')

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
app.use(cors())
app.use('/api/v1/history', router);
app.set('secretforjwt', config.secret);

router.get("/history", verifytoken, (req, res, next) => {
  const params = {
    TableName: "history",
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': req.decoded.id,
    },
  };

  dynamodb.query(params, function(error, data) {
      if (error) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(error, null, 2));
          res.status(400).json({ "error": error, "data": null, "success": false })
      } else {
          if (Object.keys(data).length != 0) res.status(200).json({ "error": null, "data": data.Items, "success": true })
          else res.status(400).json({ "error": data, "data": null, "success": false })
      }
  });
})

router.get("/", (req, res, next) => {
  res.status(200).json({ "message": "Service 'history' running " + new Date(), "error": null, "success": true })
})

var port = config.port;
var server = app.listen(port, function () {
    console.log("🌐 Express 'history' server listening on port: " + port);
});