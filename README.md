# Stadium Events
An iCal parser that takes in the iCal file from your local stadium / arena, and converts it so you get alerted for upcoming traffic

# Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

# Local Setup

```bash
npm install -g aws-cdk typescript
npm install
npm run build
```

# Deployment

```bash
cdk deploy
```

# CDK Development Notes

NodeJS Lambda Function: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs-readme.html

First Time Setup `cdk bootstrap ...`
