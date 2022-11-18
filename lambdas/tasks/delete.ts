import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { statusCreate, statusFail, statusForbidden } from "../utils/responses";
import { getUserId, isAuthorized } from "../utils/authorizer";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!isAuthorized(event)) return statusForbidden();
  const userUuid = getUserId(event);
  const listUuid = event.pathParameters?.uuid;
  const uuid = event.pathParameters?.taskUuid;
  if (!uuid) return statusFail("Missing uuid");

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
    .deleteItem({
      TableName: "Tasks",
      Key: DynamoDB.Converter.marshall({
        id: uuid,
      }),
    })
    .promise();
  return statusCreate();
};
