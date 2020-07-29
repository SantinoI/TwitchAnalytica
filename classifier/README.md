## Deploy the microservices

#### Create the repo ECR
`aws ecr create-repository --repository-name twich-analytica/classifier`

**Optional**
`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com`

#### Docker, build tag & push

`docker build -t twich-analytica/classifier .`

`docker tag twich-analytica/classifier:latest <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com/twich-analytica/classifier:latest`

`docker push <YOUR-AWS_ID>.dkr.ecr.us-east-1.amazonaws.com/twich-analytica/classifier:latest`

#### Create a Task definition
- From the **Amazon ECS** left navigation menu, select **Task Definitions**.
- Select **Create new Task Definition**.
- On the **Select launch type compatibility page**, select the **EC2** option then select **Next step**.
- On the **Configure task and container** definitions page, do the following:
  - In the Task Definition Name field, enter classifier.
  - Scroll down to Container Definitions and select Add container.
  - In the Add container window:
     - Parameters that are not defined can be either left blank or with the default settings.
     - In the Container name field, enter classifier.
     - In the Image field, enter <YOUR-AWS_ID>.dkr.ecr.<YOU-REGION>.amazonaws.com/user:latest
     - In the Memory Limits field, verify Hard limit is selected and enter 512 as the value.
     - Scroll to ENVIRONMENT, CPU units = 256.
- Select Add., You will return to the Configure task and container definitions page.
- Scroll to the bottom of the page and select Create.
