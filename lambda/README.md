## subscribeToLive.py
Following this step to configure DynamoDB Stream with Lambda and Trigger the function each time new element appear in database
https://docs.amazonaws.cn/en_us/amazondynamodb/latest/developerguide/Streams.Lambda.Tutorial.html
You can also skip the following steps:
- Step 1: Create a DynamoDB
- Step 3: Create an Amazon SNS Topic

`zip subscribeToLive.zip subscribeToLive.py`
```sh
aws lambda create-function --function-name subscribeToLive \
--zip-file fileb://subscribeToLive.zip --handler index.handler --runtime python3.6 \
--role <YOU-ROLE-ARN>
```

Reference to Python Lambda function: https://docs.aws.amazon.com/lambda/latest/dg/python-package.html

## changeStreamGame.py

`zip changeStreamGame.zip changeStreamGame.py`
```sh
aws lambda create-function --function-name changeStreamGame \
--zip-file fileb://changeStreamGame.zip --handler index.handler --runtime python3.6 \
--role <YOU-ROLE-ARN>
```

## changeStreamTitle.py

`zip changeStreamTitle.zip changeStreamTitle.py`
```sh
aws lambda create-function --function-name changeStreamTitle \
--zip-file fileb://changeStreamTitle.zip --handler index.handler --runtime python3.6 \
--role <YOU-ROLE-ARN>
```
