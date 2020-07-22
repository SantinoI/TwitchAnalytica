#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
import datetime
import pprint

from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.url_map.strict_slashes = False
app.config["APPLICATION_ROOT"] = "/api/v1"


@app.errorhandler(Exception)
def handle_error(e):
    response = {"error": True, "message": "Sorry we can accept your request"}
    return Response(json.dumps(response), status=500, mimetype="application/json")


@app.route("/", methods=["GET", "POST"])
def home():
    response = {"error": False, "message": "Webhook service up at: {}".format(datetime.datetime.now().strftime("%Y/%m/%d %H:%M:%S"))}
    return Response(json.dumps(response), status=200, mimetype="application/json")


@app.route("/webhook", methods=["POST"])
def webhook_post():
    # pprint.pprint(request.json)
    data = request.json["data"]
    if data == []:
        print("The live is over ....")
    else:
        print("The live has changed .... to: ", data)
    return Response("", status=200, mimetype="text/plain")


@app.route("/webhook", methods=["GET"])
def webhook_get():
    # pprint.pprint(request.args)
    return Response(request.args.get("hub.challenge"), status=200, mimetype="text/plain")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7584, threaded=True, debug=False)
