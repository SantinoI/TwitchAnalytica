const config = require('./config/main');

const superagent = require('superagent');
const async = require('async');
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
app.use('/api/v1/users', router);
app.set('secretforjwt', config.secret);

// https://id.twitch.tv/oauth2/authorize?client_id=pb61bwxg5i85ob9vhxmwkm551sdr9u&redirect_uri=http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/singup&response_type=code&scope=user:edit:broadcast user:read:email

// https://id.twitch.tv/oauth2/authorize?client_id=pb61bwxg5i85ob9vhxmwkm551sdr9u&redirect_uri=http://localhost:3000/api/v1/singup&response_type=code&scope=user:edit:broadcast user:read:email

// https://www.npmjs.com/package/async-waterfall
// https://visionmedia.github.io/superagent/

// https://www.dynamodbguide.com/updating-deleting-items/
// https://docs.aws.amazon.com/it_it/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.html


router.get('/user', verifytoken, (req, res, next) => {
  const params = {
    TableName: "users",
    Key: { id:  req.decoded.id }
  };

  dynamodb.get(params, function(error, data) {
      if (error) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(error, null, 2));
          res.status(400).json({ "error": error, "data": null, "success": false })
      } else {
          if (Object.keys(data).length != 0) {
            delete data.Item.access_token;
            res.status(200).json({ "error": null, "data": data.Item, "success": true })
          }
          else res.status(400).json({ "error": data, "data": null, "success": false })
      }
  });
})

router.post('/user', verifytoken, (req, res, next) => {
  const params = {
      TableName: "users",
      Key: { id: req.decoded.id },
      UpdateExpression: "set gameTitles = :gameTitles",
      ExpressionAttributeValues:{ ":gameTitles": req.body.gameTitles },
      ReturnValues: "ALL_NEW"
  };
  dynamodb.update(params, function(error, data) {
    if (error) {
      console.error("Unable to update item. Error JSON:", JSON.stringify(error, null, 2));
      res.status(400).json({ "error": data, "data": null, "success": false })
    } else {
        delete data.access_token;
        res.status(200).json({ "error": null, "data": data, "success": true })
    }
  });
})

router.get('/singup', (req, res, next) => {

    const params = {
        client_id: config.twitch.client_id,
        client_secret: config.twitch.client_secret,
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: config.twitch.redirect_uri
    }

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
                    if (!access_token) callback(null, true, { success: false, message: 'Error: Invalid code' });
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

                let user = results.user.data[0];
                const params = {
                TableName: "users",
                Key: { id:  user["id"] }
                };

                dynamodb.get(params, function(error, data) {
                    if (error) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(error, null, 2));
                        callback(null, true, {"access_token": results.access_token, "user": user});  // Create a new user
                    } else {
                        // console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                        if (Object.keys(data).length != 0) callback(null, false, {"access_token": results.access_token, "user": data.Item});
                        else callback(null, true, {"access_token": results.access_token, "user": user});  // Create a new user
                    }
                });
            }
        },
        (create_user, results, callback) => {
            let user = results.user
            user["access_token"] = results.access_token

            if (!create_user){ // Use found in the database, do an update of access_token
                const params = {
                    TableName: "users",
                    Key: { id:  user["id"] },
                    UpdateExpression: "set access_token = :token",
                    ExpressionAttributeValues:{ ":token": results.access_token },
                    ReturnValues: "NONE"
                };
                dynamodb.update(params, function(error, data) {
                if (error) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(error, null, 2));
                    callback(null, false, error);
                } else callback(null, true, user);  // Success
                });
            }
            else {
                user["gameTitles"] = {}
                const params = { TableName: "users", Item: user };

                dynamodb.put(params, function(error, data) {
                if (error) {
                    console.error("Unable to add user", user.login, ". Error JSON:", JSON.stringify(error, null, 2));
                    callback(null, false, error);
                } else callback(null, true, user);  // Success
                });
            }
        }
        ], (err, status, data) => {
            if(status == true){
            let payload = { username: data.login, id: data.id }
            let access_token = jwt.sign(payload, app.get('secretforjwt'), { expiresIn: "99 days" });
            // res.status(200).json({ "message": "Signed in", "error": null, "access_token": access_token, "success": true })
            console.log({ "message": "Signed in", "error": null, "access_token": access_token, "success": true })
            // res.cookie('access_token', access_token);
            res.redirect(302, `${config.profile_redirect}?access_token=${access_token}`);
            }
            else res.status(400).json({ "message": "Something went wrong", "error": data, "access_token": null, "success": false })
        });

});

router.get("/", (req, res, next) => {
  res.status(200).json({ "message": "Service 'users' running " + new Date(), "error": null, "success": true })
})

/* // Just a test with secrets ...
router.get("/env", async (req, res, next) => {
    res.status(200).json(`Here the Enviroment: ${JSON.stringify(process.env, null, 2)}`)
})

router.get("/client_id", async (req, res, next) => {
    res.status(200).json(`The client_id is: ${JSON.parse(process.env.env_twitch_clientid).twitch.client_id}`)
})
*/

var port = config.port;
var server = app.listen(port, function () {
    console.log("🌐 Express 'users' server listening on port: " + port);
});