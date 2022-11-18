import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { statusCreate, statusFail, statusForbidden } from "../utils/responses";
import { getUserId, isAuthorized } from "../utils/authorizer";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!isAuthorized(event)) return statusForbidden();
  const uuid = event.pathParameters?.uuid;
  if (!uuid) return statusFail("Missing uuid");

  const client = new DynamoDB();
  await client
    .deleteItem({
      TableName: "Lists",
      Key: DynamoDB.Converter.marshall({
        id: uuid,
      }),
    })
    .promise();
  return statusCreate();
};
