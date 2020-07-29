#### 1. Create a new bucket for host the frontend 
`aws s3 mb s3://<YOU-BUCKET-NAME>`
#### 2. Set the bucket ad Web Hosting and set the index.html as main file:
`aws s3 website s3://<YOU-BUCKET-NAME> --index-document index.html`
#### 3. Make the bucket public with the bucket-policy.json file
`aws s3api put-bucket-policy --bucket <YOU-BUCKET-NAME> --policy file://./artifacts-bucket-policy.json`
#### 2. Copy recursive the content of the Frontend folder inside the bucket
`aws s3 cp --recursive ./TwitchAnalytica/frontend/ s3://<YOU-BUCKET-NAME>`
