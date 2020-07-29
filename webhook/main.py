#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
import datetime
import boto3
import logging
import sys

from flask import Flask, request, Response
from flask_cors import CORS

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(name)s - [%(funcName)s]: %(message)s", datefmt="%d/%m/%Y %H:%M:%S", level=logging.INFO,
)
logger = logging.getLogger("WEBHOOK")

app = Flask(__name__)
CORS(app)

app.url_map.strict_slashes = False

ecs = boto3.client('ecs', region_name="us-east-1")


@app.errorhandler(Exception)
def handle_error(e):
    response = {"error": True, "message": "Sorry we can accept your request", "exception": str(e)}
    return Response(json.dumps(response), status=500, mimetype="application/json")


@app.route("/api/v1/webhook/", methods=["GET", "POST"])
def home():
    response = {"error": False, "message": "Webhook service up at: {}".format(datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S"))}
    return Response(json.dumps(response), status=200, mimetype="application/json")


@app.route("/api/v1/webhook/<string:user_id>", methods=["POST"])
def webhook_post(user_id):
    data = request.json["data"]
    logger.info("POST request for: {}, with data: {}".format(user_id, data))
    try:
        cluster = "TwitchAnalytica-Stack-ECSCluster-qw1JXJOQr1y6"
        # Get the list of current task startedBy this service and dedicated to this username.
        response = ecs.list_tasks(
            cluster=cluster,
            startedBy="Webhook for: {}".format(user_id)
        )
        logger.info("Response from list_tasks: {}".format(response))
        tasks = response["taskArns"]

        # arns = response["taskArns"]
        # response = ecs.describe_tasks(
        #     cluster=cluster,
        #     tasks=arns
        # )
        # tasks = response["tasks"]

        # If data == [] => The live is over and if tasks != [] we have currently task active, going to stop task.
        if data == [] and tasks != []:
            for task_arn in tasks:
                response = ecs.stop_task(
                    cluster=cluster,
                    task=task_arn,
                    reason="The live stream of: {} is over".format(user_id)
                )
                logger.info("Response from stop_task: {}".format(response))
        # If data != [] => The live has changed is state and if tasks == [] we need to start a dedicated task.
        elif data != [] and tasks == []:
            response = ecs.run_task(
                cluster=cluster,
                overrides={
                    'containerOverrides': [
                        {
                            'name': "classifier",
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
                taskDefinition='classifier'
            )
            logger.info("Response from run_task: {}".format(response))
    except Exception as e:
        logger.info("Exception raised: {}".format(e))

    return Response("", status=200, mimetype="text/plain")


@app.route("/api/v1/webhook/<string:user_id>", methods=["GET"])
def webhook_get(user_id):
    logger.info("GET request for: {}".format(user_id))
    return Response(request.args.get("hub.challenge"), status=200, mimetype="text/plain")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7584, threaded=True, debug=False)
