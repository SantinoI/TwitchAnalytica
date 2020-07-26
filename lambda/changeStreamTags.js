'use strict';
var AWS = require("aws-sdk");
var https = require('https');

const secretsManager = new AWS.SecretsManager({region: "us-east-1"});

// https://gist.github.com/rxgx/7e1b24de5936ff1b2b815a3d9cc3897a
// https://dev.twitch.tv/docs/api/reference#replace-stream-tags

exports.handler = async (event, context, callback) => {
    const data = await secretsManager.getSecretValue({SecretId: "twitch.client_id"}).promise();
    const client_id = JSON.parse(data.SecretString).twitch.client_id;

    const user_id = event.id;
    const access_token = event.access_token;
    const tag_ids = event.game;

    const data = JSON.stringify({
        "tag_ids": tag_ids
    })

    const options = {
        hostname: 'api.twitch.tv',
        port: 443,
        path: `/helix/streams/tags?broadcaster_id=${user_id}`,
        method: 'PUT',
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

    // callback(null, `Successfully processed ${event.Records.length} records.`);
};

