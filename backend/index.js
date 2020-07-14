const config = require('./config/main');

const { v4: uuidv4 } = require('uuid');
const superagent = require('superagent');
const async = require('async');
const express = require('express');
const AWS = require("aws-sdk");

// AWS.config.update(config.aws);
// const docClient = new AWS.DynamoDB.DocumentClient();

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
// app.set('secretforjwt', config.secret);

// https://docs.aws.amazon.com/it_it/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.html
// https://id.twitch.tv/oauth2/authorize?client_id=pb61bwxg5i85ob9vhxmwkm551sdr9u&redirect_uri=http://localhost:3000/api/v1/singup&response_type=code&scope=user:edit:broadcast user:read:email
/*
POST https://id.twitch.tv/oauth2/token
    ?client_id=<your client ID>
    &client_secret=<your client secret>
    &code=<authorization code received above>
    &grant_type=authorization_code
    &redirect_uri=<your registered redirect URI>
*/

/*
router.get('/welcome', (req, res, next) => {
	return res.status(201).json({ message: "Ciao ragazzi come va, benvenuti....."});
})
*/

router.get('/singup', (req, res, next) => {
    // console.log("First request received", req.query)

    const params = {
        client_id: config.twitch.client_id,
        client_secret: config.twitch.client_secret,
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/api/v1/singup" 
    }
    console.log("Create args for 2th request", params)

    // https://www.npmjs.com/package/async-waterfall
    // https://visionmedia.github.io/superagent/

    async.waterfall([
      (callback) => {
        superagent
          .post('https://id.twitch.tv/oauth2/token')
          .send(params)
          .set('Accept', 'application/json')
          .then((response) => {
            // console.log('response', response);
            const { access_token } = response.body;
            console.log('generate_access_token_response', response.body);

            if (!access_token) {
              callback(null, true, {
                success: false,
                message: 'Error: Invalid code'
              });
            } else {
              callback(null, false, { access_token: access_token });
            }
          }).catch((error) => {
            console.error(error)
            callback(null, false, error);
        });
      },
      (hasCompleted, results, callback) => {

        /*
            curl  -H 'Client-ID: uo6dggojyb8d6soh92zknwmi5ej1q2' \
            -H 'Authorization: Bearer cfabdegwdoklmawdzdo98xt2fo512y' \
            -X GET 'https://api.twitch.tv/helix/users?id=44322889'
        */

        if (hasCompleted) {
          callback(null, hasCompleted, results);
        } else {
          const access_token = results.access_token;

          console.log("2th callback", `'Bearer ${access_token}`)
          // Get User
          superagent
            .get('https://api.twitch.tv/helix/users')
            .set('Client-ID', config.twitch.client_id)
            .set('Authorization', `Bearer ${access_token}`)
            .then((responseUser) => {
              const userBody = responseUser.body;
              // console.log('get_user_response', responseUser.body);

              callback(null, true, { access_token: access_token, user: userBody });

            }).catch((error) => {
                console.error(error)
                callback(null, false, error);
            });
        } // end of else for hasCompleted
      }
    ], (err, status, data) => {
        // console.log(status, data);

        if(status == true) res.status(201).json({ "message": "Signed in", "data": data, "success": true })
        else res.status(400).json({ "message": "Something went wrong", "data": data, "success": false })

    }); // end of async waterfall

    // The following code is for DynamoDB. 

    /*
    const params = {
        TableName: "users",
        Item: {
            "userId": uuidv4(),
            "username": movie.title,
            "info":  movie.info
        }
    };

    docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", movie.title);
       }
    });
    */
});

var port = config.port;
var server = app.listen(port, function () {
    console.log('Express server listening on port ' + port);
});