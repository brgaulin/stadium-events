import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import events = require('aws-cdk-lib/aws-events');
import targets = require('aws-cdk-lib/aws-events-targets');
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import iam = require('aws-cdk-lib/aws-iam');
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class StadiumEventsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function
    const lambdaFn = new NodejsFunction(this, 'main', {
      runtime: Runtime.NODEJS_20_X ,
      timeout: cdk.Duration.seconds(300),
      environment: {
        TZ: 'America/New_York'
      }
    })

    // Run the eventbridge every week
    const rule = new events.Rule(this, 'WeeklyCron', {
      schedule: events.Schedule.expression('cron(0 6 ? * 2 *)')
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFn));

    const s3PutPolicy = new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      resources: ['arn:aws:s3:::simple-gillette-calendar/events.ics'],
    });

    lambdaFn.addToRolePolicy(s3PutPolicy);
  }
}
