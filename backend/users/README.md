## Local config
1. Rename the config/main.js.dist to config/main.js
2. Populate the file 
```js
module.exports = {
    'port': process.env.PORT || 3000,  /* Your service port, we suggest 3000 */
    'aws': {
        'region': "us-east-1",  /* You aws region */
        'endpoint': "https://dynamodb.us-east-1.amazonaws.com"  /* Use localhost if you want to test before going live*/
    },
    'twitch': {
        'client_id': "pb61xxxxxxxxxxxxxxxxxxdr9u",  /* You need to have a Twitch App - Get the data in https://dev.twitch.tv/console */
        'client_secret': "jws7xxxxxxxxxxxxxxxxxi0h0ic",  /* You need to have a Twitch App - Get the data in https://dev.twitch.tv/console */
        'redirect_uri': "http://twitc-ecsal-it3rj1p6kk2r-780238624.us-east-1.elb.amazonaws.com/api/v1/users/singup"  /* Twitch redirect url for complete the handshake */
    },
    'profile_redirect': "http://127.0.0.1:5500/frontend/profile.html",  /* Se a url redirection after the login complete */
    'secret': "SUPER-SECRET-VALUE"  /* Make sure to have the same value also in history/config/main.js https://passwordsgenerator.net/ */
};

```

## Deploy the microservices

#### Create the repo ECR
`aws ecr create-repository --repository-name twich-analytica/users`

**Optional**
`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com`

#### Docker, build tag & push

`docker build -t twich-analytica/users .`

`docker tag twich-analytica/users:latest <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com/twich-analytica/users:latest`

`docker push <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com/twich-analytica/users:latest`

#### Create a Task definition
- From the **Amazon ECS** left navigation menu, select **Task Definitions**.
- Select **Create new Task Definition**.
- On the **Select launch type compatibility page**, select the **EC2** option then select **Next step**.
- On the **Configure task and container** definitions page, do the following:
  - In the Task Definition Name field, enter users.
  - Scroll down to Container Definitions and select Add container.
  - In the Add container window:
     - Parameters that are not defined can be either left blank or with the default settings.
     - In the Container name field, enter users.
     - In the Image field, enter <YOUR-AWS_ID>.dkr.ecr.<YOU-REGION>.amazonaws.com/user:latest
     - In the Memory Limits field, verify Hard limit is selected and enter 256 as the value.
     - Under Port mappings, Host port = 0 and Container port = 3000. 
     - Scroll to ENVIRONMENT, CPU units = 256.
     - Scroll to STORAGE AND LOGGING, check **Auto-configure CloudWatch Logs**
- Select Add., You will return to the Configure task and container definitions page.
- Scroll to the bottom of the page and select Create.
  
## Configure the load balancer with targets groups
```sh
aws elbv2 create-target-group \
   --name users \
   --region <YOUR-REGION>\
   --port 80 \
   --protocol HTTP \
   --target-type Instance \
   --vpc-id <YOUR-VPC-ID> \
   --health-check-interval-seconds 30 \
   --health-check-path /api/v1/users \
   --health-check-protocol HTTP \
   --healthy-threshold-count 5 \
   --unhealthy-threshold-count 2
```

## Create a Service in ECS
- Navigate to the Amazon ECS console and select **Clusters** from the left menu bar.
- Select you cluster, select the **Services** tab then select **Create**.
- On the Configure service page, edit the following parameters (and keep the default values for parameters not listed below): 
  - For the **Launch type**, select **EC2**.
  - For the **Task Defintion**, select **users**.
  - For the **Service name**, enter users. 
  - For the Number of tasks, enter 1.
  - Select Next step.
- On the **Configure network** page, **Load balancing** section, select **Application Load Balancer**
- In the Container to load balance section, select **users:3000** and then **Add to load balancer**.
  - In the users:3000 section, do the following:
  - For the Production listener port field, select 80:HTTP.
  - For the Target group name, select your group: users.
  - Select Next step.
- On the Set **Auto Scaling** page, leave the default setting and select **Next step**.
- On the **Review** page, review the settings then select **Create Service**.
- After the service has been created, select **View Service**.
