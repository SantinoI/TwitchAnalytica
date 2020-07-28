import json
from botocore.vendored import requests
import boto3


def lambda_handler(event, context):
    session = boto3.session.Session()
    secret_manager = session.client(service_name='secretsmanager', region_name="us-east-1")
    client_id = secret_manager.get_secret_value(SecretId="twitch.client_id")
    client_id = json.loads(client_id["SecretString"])["twitch"]["client_id"]

    response = requests.patch("https://api.twitch.tv/helix/channels?broadcaster_id={}".format(event["user_id"]), params={"title": event["title"]}, headers={
        "Authorization": "Bearer {}".format(event["access_token"]),
        "Client-ID": client_id
    })
    return {'status_code': response.status_code, 'text': response.text}
