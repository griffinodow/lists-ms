import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { statusCreate, statusFail, statusForbidden } from "../utils/responses";
import { getUserId, isAuthorized } from "../utils/authorizer";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) return statusFail();
  if (!isAuthorized(event)) return statusForbidden();
  const userUuid = getUserId(event);
  const listUuid = event.pathParameters?.uuid;
  const uuid = event.pathParameters?.taskUuid;
  const { name, order, complete } = JSON.parse(event.body);
  if (!listUuid) return statusFail("Missing list uuid");
  if (!uuid) return statusFail("Missing email");
  if (!name) return statusFail("Missing name");
  if (typeof order === undefined) return statusFail("Missing order");
  if (typeof complete === undefined) return statusFail("Missing tasks");

  const client = new DynamoDB();
  const listData = await client
    .getItem({
      TableName: "Lists",
      Key: {
        id: { S: listUuid },
      },
    })
    .promise();

  const list = listData?.Item && DynamoDB.Converter.unmarshall(listData?.Item);
  if (!list) return statusFail("Missing list");
  if (list.userId !== userUuid) return statusForbidden();

  await client
    .putItem({
      TableName: "Tasks",
      Item: DynamoDB.Converter.marshall({
        id: uuid,
        listUuid,
        name,
        order,
        complete,
      }),
    })
    .promise();
  return statusCreate();
};
