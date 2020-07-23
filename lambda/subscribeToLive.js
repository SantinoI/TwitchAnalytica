'use strict';
var AWS = require("aws-sdk");
var https = require('https');

const secretsManager = new AWS.SecretsManager({region: "us-east-1"});

// https://gist.github.com/rxgx/7e1b24de5936ff1b2b815a3d9cc3897a

exports.handler = async (event, context, callback) => {

    event.Records.forEach((record) => {
        console.log('Stream record: ', JSON.stringify(record, null, 2));
        if(record.eventName == "INSERT"){

          const data = await secretsManager.getSecretValue({SecretId: "twitch.client_id",}).promise();
          const client_id = JSON.parse(data.SecretString).twitch.client_id;

          const user_id = record.dynamodb.NewImage.S.id;  // Get this from record ...
          const access_token = record.dynamodb.NewImage.S.access_token;  // Get this from record ...

          const data = JSON.stringify({
              "hub.callback": "http://460ec3f71132.ngrok.io/webhook",  // Should the url of our webhook
              "hub.mode": "subscribe",
              "hub.topic": `https://api.twitch.tv/helix/streams?user_id=${user_id}`,
              "hub.lease_seconds": 432000
            })

            const options = {
              hostname: 'api.twitch.tv',
              port: 443,
              path: '/helix/webhooks/hub',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Authorization': `Bearer ${access_token}`,
                'Client-ID': client_id
              }
            }

            const req = https.request(options, (res) => {
              console.log(`statusCode: ${res.statusCode}`)
              callback(null, "Got response: " + res.statusCode);
              // res.setEncoding('utf8');
              // res.on('data', (d) => { process.stdout.write(d) })
            })

            req.on('error', (error) => {
              console.error(error)
              callback(new Error(error));
            })

            req.write(data)
            req.end()
        }
        else callback(null, `Successfully processed ${event.Records.length} records.`);
    });
};
