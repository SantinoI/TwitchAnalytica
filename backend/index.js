const config = require('./config/main');

const { v4: uuidv4 } = require('uuid');
const superagent = require('superagent');
const async = require('async');
const express = require('express');
const jwt = require('jsonwebtoken');
const AWS = require("aws-sdk");

AWS.config.update(config.aws);
const docClient = new AWS.DynamoDB.DocumentClient();

const app = express();
const router = express.Router();

// const jwt = require('jsonwebtoken');
// const verifytoken = require('./middlewares/verifytoken');

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

// https://id.twitch.tv/oauth2/authorize?client_id=pb61bwxg5i85ob9vhxmwkm551sdr9u&redirect_uri=http://localhost:3000/api/v1/singup&response_type=code&scope=user:edit:broadcast user:read:email

// https://www.npmjs.com/package/async-waterfall
// https://visionmedia.github.io/superagent/

router.get('/singup', (req, res, next) => {
    // console.log("First request received", req.query)

    const params = {
        client_id: config.twitch.client_id,
        client_secret: config.twitch.client_secret,
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/api/v1/singup"
    }
    // console.log("Create args for 2th request", params)

    async.waterfall([
      (callback) => {

        /*
          POST https://id.twitch.tv/oauth2/token
              ?client_id=<your client ID>
              &client_secret=<your client secret>
              &code=<authorization code received above>
              &grant_type=authorization_code
              &redirect_uri=<your registered redirect URI>
        */

        superagent
          .post('https://id.twitch.tv/oauth2/token')
          .send(params)
          .set('Accept', 'application/json')
          .then((response) => {
            const { access_token } = response.body;
            if (!access_token) callback(null, true, { success: false, message: 'Error: Invalid code'});
            else callback(null, true, { access_token: access_token });
          }).catch((error) => {
            console.error(error)
            callback(null, false, error);
        });
      },
      (success, results, callback) => {

        /*
            curl  -H 'Client-ID: uo6dggojyb8d6soh92zknwmi5ej1q2' \
            -H 'Authorization: Bearer cfabdegwdoklmawdzdo98xt2fo512y' \
            -X GET 'https://api.twitch.tv/helix/users?id=44322889'
        */

        if (!success) callback(null, success, results);
        else {
          const access_token = results.access_token;

          superagent
            .get('https://api.twitch.tv/helix/users')
            .set('Client-ID', config.twitch.client_id)
            .set('Authorization', `Bearer ${access_token}`)
            .then((responseUser) => {
              const userBody = responseUser.body;
              callback(null, true, { access_token: access_token, user: userBody });
            }).catch((error) => {
                console.error(error)
                callback(null, false, error);
            });
        }
      },
      (success, results, callback) => {
        if (!success) callback(null, success, results);
        else {
          // The following code is for DynamoDB.
          // https://www.dynamodbguide.com/updating-deleting-items/
          // https://docs.aws.amazon.com/it_it/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.html
          let user = results.user.data[0];
          user["userId"] = uuidv4()
          user["access_token"] = results.access_token
          user["userTwitchId"] = user["id"]
          delete user["id"]

          const params = { TableName: "usersTable", Item: user };

          docClient.put(params, function(error, data) {
            if (error) {
              console.error("Unable to add user", user.login, ". Error JSON:", JSON.stringify(error, null, 2));
              callback(null, false, error);
            } else {
              let payload = { username: user.login, userId: user.userId, userTwitchId: user.userTwitchId }
              let token = jwt.sign(payload, app.get('secretforjwt'), { expiresIn: "99 days" });
              callback(null, true, token);  // Success
            }
          });
        }
      }

    ], (err, status, data) => {
        if(status == true) res.status(201).json({ "message": "Signed in", "error": null, "access_token": data, "success": true })
        else res.status(400).json({ "message": "Something went wrong", "error": data, "access_token": null, "success": false })
    });

});

var port = config.port;
var server = app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});