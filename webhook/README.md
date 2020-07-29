## Subscribe and unsubscribe | Examples code

**[POST]** => https://api.twitch.tv/helix/webhooks/hub

**JSON Data**
```
{
    "hub.callback": "http://460ec3f71132.ngrok.io/webhook",
    "hub.mode": "subscribe",
    "hub.topic": "https://api.twitch.tv/helix/streams?user_id=198215664",
    "hub.lease_seconds": 432000
}
```

**Headers**

- Authorization: Bearer [XXX]
- Client-ID: [XXX]

## Examples

```python
{'data': [{'game_id': '509670',
           'id': '51311442',
           'language': 'it',
           'started_at': '2020-07-15T15:58:09Z',
           'tag_ids': None,
           'thumbnail_url': 'https://static-cdn.jtvnw.net/previews-ttv/live_user_tkdalex-{width}x{height}.jpg',
           'title': 'Coding time - chill',
           'type': 'live',
           'user_id': '198215664',
           'user_name': 'TkdAlex',
           'viewer_count': 1}]}
127.0.0.1 - - [15/Jul/2020 18:00:22] "POST /webhook HTTP/1.1" 200 -
```

```python
{'data': [{'game_id': '509670',
           'id': '51311442',
           'language': 'it',
           'started_at': '2020-07-15T15:58:09Z',
           'tag_ids': ['5b9935eb-1e9a-4217-98ad-62bda5cff0d1'],
           'thumbnail_url': 'https://static-cdn.jtvnw.net/previews-ttv/live_user_tkdalex-{width}x{height}.jpg',
           'title': 'Coding time - Test webhoooooks',
           'type': 'live',
           'user_id': '198215664',
           'user_name': 'TkdAlex',
           'viewer_count': 1}]}
127.0.0.1 - - [15/Jul/2020 18:02:49] "POST /webhook HTTP/1.1" 200 -
```

```python
{'data': []}
127.0.0.1 - - [15/Jul/2020 18:04:01] "POST /webhook HTTP/1.1" 200 -
```

## Local config
1. Populate the cluster variable with your cluster name

## Deploy the microservices

#### Create the repo ECR
`aws ecr create-repository --repository-name twich-analytica/webhook`

**Optional**
`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com`

#### Docker, build tag & push

`docker build -t twich-analytica/webhook .`

`docker tag twich-analytica/webhook:latest <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com/twich-analytica/webhook:latest`

`docker push <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com/twich-analytica/webhook:latest`

#### Create a Task definition
- From the **Amazon ECS** left navigation menu, select **Task Definitions**.
- Select **Create new Task Definition**.
- On the **Select launch type compatibility page**, select the **EC2** option then select **Next step**.
- On the **Configure task and container** definitions page, do the following:
  - In the Task Definition Name field, enter webhook.
  - Scroll down to Container Definitions and select Add container.
  - In the Add container window:
     - Parameters that are not defined can be either left blank or with the default settings.
     - In the Container name field, enter webhook.
     - In the Image field, enter <YOUR-AWS_ID>.dkr.ecr.<YOU-REGION>.amazonaws.com/user:latest
     - In the Memory Limits field, verify Hard limit is selected and enter 256 as the value.
     - Under Port mappings, Host port = 0 and Container port = 7584. 
     - Scroll to ENVIRONMENT, CPU units = 256.
- Select Add., You will return to the Configure task and container definitions page.
- Scroll to the bottom of the page and select Create.
  
## Configure the load balancer with targets groups
```sh
aws elbv2 create-target-group \
   --name webhook \
   --port 80 \
   --protocol HTTP \
   --target-type Instance \
   --vpc-id <YOUR-VPC-ID> \
   --health-check-interval-seconds 30 \
   --health-check-path /api/v1/webhook \
   --health-check-protocol HTTP \
   --healthy-threshold-count 5 \
   --unhealthy-threshold-count 2
```

## Create a Service in ECS
- Navigate to the Amazon ECS console and select **Clusters** from the left menu bar.
- Select you cluster, select the **Services** tab then select **Create**.
- On the Configure service page, edit the following parameters (and keep the default values for parameters not listed below): 
  - For the **Launch type**, select **EC2**.
  - For the **Task Defintion**, select **webhook**.
  - For the **Service name**, enter webhook. 
  - For the Number of tasks, enter 1.
  - Select Next step.
- On the **Configure network** page, **Load balancing** section, select **Application Load Balancer**
- In the Container to load balance section, select **webhook:7584** and then **Add to load balancer**.
  - In the webhook:7584 section, do the following:
  - For the Production listener port field, select 80:HTTP.
  - For the Target group name, select your group: webhook.
  - Select Next step.
- On the Set **Auto Scaling** page, leave the default setting and select **Next step**.
- On the **Review** page, review the settings then select **Create Service**.
- After the service has been created, select **View Service**.
