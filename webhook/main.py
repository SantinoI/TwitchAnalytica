#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
import datetime
import boto3

from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.url_map.strict_slashes = False
app.config["APPLICATION_ROOT"] = "/api/v1"

ecs = boto3.client('ecs')


@app.errorhandler(Exception)
def handle_error(e):
    response = {"error": True, "message": "Sorry we can accept your request"}
    return Response(json.dumps(response), status=500, mimetype="application/json")


@app.route("/", methods=["GET", "POST"])
def home():
    response = {"error": False, "message": "Webhook service up at: {}".format(datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S"))}
    return Response(json.dumps(response), status=200, mimetype="application/json")


@app.route("/webhook/<string:user_id>", methods=["POST"])
def webhook_post(user_id):
    data = request.json["data"]
    cluster = "TwitchAnalytica-Stack-ECSCluster-qw1JXJOQr1y6"
    # Get the list of current task startedBy this service and dedicated to this username.
    response = ecs.list_tasks(
        cluster=cluster,
        startedBy="Webhook for: {}".format(user_id)
    )
    tasks = response["taskArns"]

    # arns = response["taskArns"]
    # response = ecs.describe_tasks(
    #     cluster=cluster,
    #     tasks=arns
    # )
    # tasks = response["tasks"]

    # If data == [] => The live is over and if tasks != [] we have currently task active, going to stop task.
    if data == [] and tasks != []:
        for task in tasks:
            response = ecs.stop_task(
                cluster=cluster,
                task=task["taskArn"],
                reason="The live stream of: {} is over".format(user_id)
            )
    # If data != [] => The live has changed is state and if tasks == [] we need to start a dedicated task.
    elif data != [] and tasks == []:
        response = ecs.run_task(
            cluster=cluster,
            overrides={
                'containerOverrides': [
                    {
                        'name': "main-worker",
                        'environment': [
                            {
                                'name': 'user_id',
                                'value': user_id
                            },
                        ],
                    },
                ],
            },
            count=1,
            startedBy="Webhook for: {}".format(user_id),
            taskDefinition='main-worker'
        )

    return Response("", status=200, mimetype="text/plain")


@app.route("/webhook/<string:id>", methods=["GET"])
def webhook_get(user_id):
    return Response(request.args.get("hub.challenge"), status=200, mimetype="text/plain")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7584, threaded=True, debug=False)
