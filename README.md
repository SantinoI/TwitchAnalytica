# TwitchAnalytica

## Cloud formation
```sh
aws cloudformation deploy \
   --template-file infrastructure/ecs.yml \
   --region <YOUR-REGION> \
   --stack-name <CHOOSE-A-NAME for Stack> \
   --capabilities CAPABILITY_NAMED_IAM
```

Check the status at: https://console.aws.amazon.com/cloudformation/ . 
Wait until Status become **CREATE_COMPLETE**

## Deploy the microservices
Now we need to:
1. Create a repository in ECR
2. Build, tag and push the code
3. Create a Task Definition in ECS
4. Configure the load balancer with targets groups
5. Create a Serivce in ECS

Follow every single README.md
- [backend/history/README.md](backend/history/README.md)
- [backend/users/README.md](backend/users/README.md)
- [webhook/README.md](webhook/README.md)
- [classifier/README.md](classifier/README.md) | __.4 and .5 not needed here__

## Write the rules for load balancer
```sh
aws elbv2 create-target-group\
   --region <YOUR-REGION>\
   --name drop-traffic\
   --protocol HTTP\
   --port 80\
   --vpc-id <YOUR-VPC-ID>\
   --healthy-threshold-count 2\
   --unhealthy-threshold-count 2\
   --health-check-timeout-seconds 5\
   --health-check-interval-seconds 6
```

**Add a Listener to the ALB**

- Navigate to the Load Balancer section of the EC2 Console.
- Select the Load Balancer details.
- Select the Listeners tab.
- Select Add listener and edit the following parameters as needed:
  - For **Protocol:port**, select **HTTP** and enter 80.
  - For **Default action(s)**, select **Forward** to and in the **Target group** field, enter drop-traffic.
- Select Save.

**Update Listener Rules**
There should only be one listener listed in this tab. Take the following steps to edit the listener rules:

- Under the Rules column, select View/edit rules.
- On the Rules page, select the plus (+) button. The option to Insert Rule appears on the page. 
- Use the following rule template to insert the necessary rules which include one to maintain traffic to the monolith and one for each microservice:
- IF Path = /api/v1/[service-name]* THEN Forward to [service-name] (For example: IF Path = /api/v1/users* THEN Forward to users)
- Insert the rules in the following order:
  - history: /api/v1/history* forwards to history
  - webhook: /api/v1/webhook* forwards to webhook
  - users: /api/v1/users* forwards to users

- Select **Save**.
- Select the back arrow at the top left corner of the page to return to the load balancer console.

## Create the lambda function, follow the [lambda/README.md](lambda/README.md)

## AWS Secrets Manager
We have also create a secret for store the Twitch client_id, anyway in the current deploy we get this value from config/main.js for backend/users and backend/history. A good idea is to remove the following config file and set the value as enviroment variable of the container. So, the task definition for users and history should have the following line in the Task Definition dedicated to the container:
```js
"secrets": [
    {
      "valueFrom": "arn:aws:secretsmanager:xxxxxx-<ARN-OF-YOUR-SECRET>",
      "name": "env_twitch_clientid"
    }
],
```
For the lambda and other python script we have used directly boto3 for retrive the secret.

1. Navigate to https://console.aws.amazon.com/secretsmanager
2. Right corner select **Store a new secret**
3. Select secre type as: **Other type of secret**
4. We have choose the plaintext mode 
__It should be cheaper because we can store more info in a string instead of a key value pair__
```js
{
  "twitch": {
    "client_id": <YOUR-TWITCH-CLIENTID>
  }
}
```
5. Click on **Next** button.
6. Choose a **Secret name** __(twitch.client_id)__
7. We don't need the automatic rotation. Click on **Next** button.
8. Click on **Store** button

## AWS IAM & Policy (summary review)
Make sure that your roles have the correct policies
For examples:
- DynamoDB - Put, query, scan and insert
- Labmbda - Invoke function
- Secretmanager: GetSecretValue and Decrypt for kms
- S3 - PutObject
- CloudFormation - Write logs
