import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { statusCreate, statusFail, statusForbidden } from "../utils/responses";
import { getUserId, isAuthorized } from "../utils/authorizer";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return statusFail();
  if (!isAuthorized(event)) return statusForbidden();
  const userId = getUserId(event);
  const { uuid, name, order, tasks } = JSON.parse(event.body);
  console.log(order);
  if (!uuid) return statusFail("Missing email");
  if (!name) return statusFail("Missing name");
  if (typeof order === undefined) return statusFail("Missing order");
  if (typeof tasks === undefined) return statusFail("Missing tasks");

  const client = new DynamoDB();
  await client
    .putItem({
      TableName: "Lists",
      Item: DynamoDB.Converter.marshall({
        id: uuid,
        userId,
        name,
        order,
        tasks,
      }),
    })
    .promise();
  return statusCreate();
};
