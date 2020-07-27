'use strict';
var AWS = require("aws-sdk");
var https = require('https');

const secretsManager = new AWS.SecretsManager({region: "us-east-1"});

// https://gist.github.com/rxgx/7e1b24de5936ff1b2b815a3d9cc3897a
// https://dev.twitch.tv/docs/api/reference#modify-channel-information

function doRequestPlease(options, data) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        let responseBody = '';

        console.log(`statusCode: ${res.statusCode}`)

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
            console.log(responseBody)
            resolve(JSON.parse(responseBody));
        });
      });

      req.on('error', (err) => {
        console.error(error)
        reject(new Error(error));
      });

      req.write(data)
      req.end();
    });
  }

exports.handler = async (event, context, callback) => {
    const secretData = await secretsManager.getSecretValue({SecretId: "twitch.client_id"}).promise();
    const client_id = JSON.parse(secretData.SecretString).twitch.client_id;

    const user_id = event.id;
    const access_token = event.access_token;
    const game_id = event.game_id;

    const data = JSON.stringify({
        "game_id": game_id
    })

    const options = {
        hostname: 'api.twitch.tv',
        port: 443,
        path: `/helix/channels?broadcaster_id=${user_id}`,
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'Authorization': `Bearer ${access_token}`,
            'Client-ID': client_id
        }
    }

    await doRequestPlease(options, data).then((response) => {
        console.log(response)
    })

    // callback(null, `Successfully processed ${event.Records.length} records.`);
};

