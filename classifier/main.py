#!/usr/bin/python3
# -*- coding: utf-8 -*-

import os
import boto3
import requests
import json
import time
import random
import uuid
import shutil

import torch

from torch import nn
from torchvision.models import squeezenet1_0
from torchvision import transforms
from torch.nn import functional as F

from PIL import Image

from boto3.dynamodb.conditions import Key

# dynamodb = boto3.resource('dynamodb', endpoint_url="http://localhost:8000")
dynamodb = boto3.resource('dynamodb', region_name="us-east-1")
s3 = boto3.client('s3', region_name="us-east-1")
lambda_client = boto3.client('lambda')

session = boto3.session.Session()
secret_manager = session.client(service_name='secretsmanager', region_name="us-east-1")


def download_image(url, path):
    time.sleep(0.03)
    filename = "{}.jpg".format(str(uuid.uuid4()))
    r = requests.get(url, headers={"user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36"}, stream=True)
    if r.status_code == 200:
        r.raw.decode_content = True
        with open(path + filename, 'wb') as f:
            shutil.copyfileobj(r.raw, f)
        print('Image sucessfully Downloaded: {}'.format(filename))
        return True, filename
    else:
        print('Image Couldn\'t be retreived')
        return False, filename


def get_model(num_class=8):
    model = squeezenet1_0(pretrained=True)
    num_class = 8
    model.classifier[1] = nn.Conv2d(512, num_class, kernel_size=(1, 1), stride=(1, 1))
    model.num_classes = num_class
    return model


squeezenet = get_model()
squeezenet.load_state_dict(torch.load('./checkpoint_k=6.pth', map_location=lambda storage, loc: storage)['state_dict'])


def evaluate(filename):
    game = {
        1: {"id": '21779', "name": 'League of Legends'},
        2: {"id": '509658', "name": 'Just Chatting'},
        3: {"id": '33214', "name": 'Fortnite'},
        4: {"id": '512710', "name": 'Call of Duty: Modern Warfare'},
        5: {"id": '18122', "name": 'World of Warcraft'},
        6: {"id": '32982', "name": 'Grand Theft Auto V'},
        7: {"id": '27471', "name": 'Minecraft'},
        8: {"id": '512804', "name": 'FIFA 20'}
    }

    im = Image.open(filename)

    im = im.resize((224, 224), Image.NEAREST)
    img = transforms.ToTensor()(im)
    img = img.view(1, *img.shape)
    y = squeezenet(img)

    y = F.softmax(y, dim=1)
    # print(y)
    p, c = y.view(-1).max(0)
    classe = int(c.item())
    # prob = float(p.item())
    # print(classe)
    return game[classe]


if __name__ == "__main__":
    while True:
        twitch_id = os.getenv("user_id")
        table = dynamodb.Table('users')
        response = table.query(KeyConditionExpression=Key('id').eq(twitch_id))
        # response = table.get_item(Key={'id': twitch_id})
        # print(response['Items'])
        for item in response['Items']:
            """
            curl --location --request GET '[https://api.twitch.tv/helix/streams](https://api.twitch.tv/helix/streams){: target="_blank"}' \
            -H 'client-id: wbmytr93xzw8zbg0p1izqyzzc5mbiz' \
            -H 'Authorization: Bearer 2gbdx6oar67tqtcmt49t3wpcgycthx'
            """

            client_id = secret_manager.get_secret_value(SecretId="twitch.client_id")
            client_id = json.loads(client_id["SecretString"])["twitch"]["client_id"]
            # print("Client-ID preso da secret: {}".format(client_id))

            headers = {
                "Client-ID": client_id,
                "Authorization": "Bearer {}".format(item["access_token"])
            }
            print(headers)
            response = requests.get("https://api.twitch.tv/helix/streams?user_id={}".format(twitch_id), headers=headers)
            print(response.text)
            if response.status_code == 200:
                json_response = response.json()
                for stream in json_response["data"]:
                    thumbnail_url = stream["thumbnail_url"].replace("{width}", str(random.randint(500, 1080))).replace("{height}", str(random.randint(500, 1080)))
                    status, filename = download_image(thumbnail_url, "./")
                    if status is True:
                        bucket_name = "stream-analytica-logs2"
                        with open(filename, "rb") as f:
                            response = s3.upload_fileobj(f, bucket_name, filename)

                        image_url = "https://{}.s3.amazonaws.com/{}".format(bucket_name, filename)
                        classified = evaluate(filename)
                        print("Immagine scaricata: {} => {}".format(classified, image_url))

                        os.remove(filename)

                        table = dynamodb.Table('history')
                        response = table.put_item(
                            Item={
                                "user_id": twitch_id,
                                "timestamp": int(time.time()),
                                "image_url": image_url,
                                "classified": classified,
                                "twitch_data": json_response["data"]
                            }
                        )
                        print(response)

                        payload = {
                            "user_id": twitch_id,
                            "access_token": item["access_token"],
                            "game_id": classified["id"]
                        }
                        print(payload)
                        response = lambda_client.invoke(
                            FunctionName='changeStreamGame',
                            LogType='Tail',
                            InvocationType='Event',
                            Payload=bytes(json.dumps(payload).encode("utf-8"))
                        )
                        print(response)

                        payload = {
                            "user_id": twitch_id,
                            "access_token": item["access_token"],
                            "title": item["gameTitles"][classified["id"]]
                        }
                        print(payload)
                        response = lambda_client.invoke(
                            FunctionName='changeStreamTitle',
                            LogType='Tail',
                            InvocationType='Event',
                            Payload=bytes(json.dumps(payload).encode("utf-8"))
                        )
                        print(response)

        time.sleep(60 * 5)
