import json
from botocore.vendored import requests
import boto3


def lambda_handler(event, context):
    for record in event["Records"]:
        if record["eventName"] == "INSERT":
            print("Current record: {}".format(record))

            session = boto3.session.Session()
            secret_manager = session.client(service_name='secretsmanager', region_name="us-east-1")
            client_id = secret_manager.get_secret_value(SecretId="twitch.client_id")
            client_id = json.loads(client_id["SecretString"])["twitch"]["client_id"]

            user_id = record["dynamodb"]["NewImage"]["id"]["S"]  # Get this from record ...
            access_token = record["dynamodb"]["NewImage"]["access_token"]["S"]  # Get this from record ...

            data = {
                "hub.callback": "http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/webhook/{}".format(user_id),  # Should the url of our webhook
                "hub.mode": "subscribe",
                "hub.topic": "https://api.twitch.tv/helix/streams?user_id={}".format(user_id),
                "hub.lease_seconds": 432000
            }
            print(data)

            response = requests.post("https://api.twitch.tv/helix/webhooks/hub", data=data, headers={
                "Authorization": "Bearer {}".format(access_token),
                "Client-ID": client_id
            })

            return {'status_code': response.status_code, 'text': response.text}
    return {'status_code': 200, 'text': "Nothing to update"}
