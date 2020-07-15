## Backend

- npm install
- copy config/main.js.dist => config/main.js
- populate the field
- node index.js

- Download https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
- Start the database: `java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb`
- Create table:
  - `aws dynamodb create-table --cli-input-json file://<YOU-PATH>/tables/usersTable.json --endpoint-url http://localhost:8000`
  - (Test command: `aws dynamodb list-tables --endpoint-url http://localhost:8000`)

## Reference:
- https://github.com/keithweaver/node-react-aws-dynamodb-boilerplate