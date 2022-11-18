import * as cdk from "aws-cdk-lib";
import * as path from "path";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  EndpointType,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { CfnApiMapping } from "aws-cdk-lib/aws-apigatewayv2";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ListsMsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Constants
    const domain = "griffindow.com";
    const subdomain = `api.tasks.${domain}`;

    // DynamoDB
    const table = new Table(this, "Lists", {
      tableName: "Lists",
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    table.addGlobalSecondaryIndex({
      indexName: "indexUser",
      partitionKey: { name: "userId", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    const tableTasks = new Table(this, "Tasks", {
      tableName: "Tasks",
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    tableTasks.addGlobalSecondaryIndex({
      indexName: "indexListUuid",
      partitionKey: { name: "listUuid", type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    // Read all list Lambda
    const handleReadAllList = new NodejsFunction(this, "ListReadAllHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/lists/read-all.ts`),
    });

    handleReadAllList.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:Query"],
        resources: ["*"],
      })
    );

    // Create list Lambda
    const handleCreateList = new NodejsFunction(this, "ListCreateHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/lists/create.ts`),
    });

    handleCreateList.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: ["*"],
      })
    );

    // Update list Lambda
    const handleUpdateList = new NodejsFunction(this, "ListUpdateHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/lists/update.ts`),
    });

    handleUpdateList.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: ["*"],
      })
    );

    // Delete list Lambda
    const handleDeleteList = new NodejsFunction(this, "ListDeleteHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/lists/delete.ts`),
    });

    handleDeleteList.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:DeleteItem"],
        resources: ["*"],
      })
    );

    // Create task Lambda
    const handleCreateTask = new NodejsFunction(this, "TaskCreateHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/tasks/create.ts`),
    });

    handleCreateTask.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:PutItem"],
        resources: ["*"],
      })
    );

    // Update task Lambda
    const handleUpdateTask = new NodejsFunction(this, "TaskUpdateHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/tasks/update.ts`),
    });

    handleUpdateTask.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:PutItem"],
        resources: ["*"],
      })
    );

    // Delete task Lambda
    const handleDeleteTask = new NodejsFunction(this, "TaskDeleteHandler", {
      runtime: Runtime.NODEJS_16_X,
      handler: "handler",
      entry: path.join(__dirname, `../lambdas/tasks/delete.ts`),
    });

    handleDeleteTask.addToRolePolicy(
      new PolicyStatement({
        actions: ["dynamodb:GetItem", "dynamodb:DeleteItem"],
        resources: ["*"],
      })
    );

    // API Gateway
    const api = new RestApi(this, "Token API", {
      endpointTypes: [EndpointType.REGIONAL],
    });
    api.root.addMethod("GET", new LambdaIntegration(handleReadAllList));
    api.root.addMethod("POST", new LambdaIntegration(handleCreateList));
    const lists = api.root.addResource("{uuid}");
    lists.addMethod("PUT", new LambdaIntegration(handleUpdateList));
    lists.addMethod("DELETE", new LambdaIntegration(handleDeleteList));
    const tasks = lists.addResource("tasks");
    tasks.addMethod("POST", new LambdaIntegration(handleCreateTask));
    const task = tasks.addResource("{taskUuid}");
    task.addMethod("PUT", new LambdaIntegration(handleUpdateTask));
    task.addMethod("DELETE", new LambdaIntegration(handleDeleteTask));

    new CfnApiMapping(this, `lists-path-mapping`, {
      apiId: api.restApiId,
      domainName: subdomain,
      stage: api.deploymentStage.stageName,
      apiMappingKey: "v1/lists",
    });
  }
}
