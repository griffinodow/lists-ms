import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import { statusCreate, statusFail, statusForbidden } from "../utils/responses";
import { getUserId, isAuthorized } from "../utils/authorizer";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!isAuthorized(event)) return statusForbidden();
  const userId = getUserId(event);
  const lastEvaluated = event.queryStringParameters?.lastEvaluated;
  if (!userId) return statusFail("Missing user");

  const client = new DynamoDB();
  const data = await client
    .query({
      TableName: "Lists",
      IndexName: "indexUser",
      Limit: 5,
      ExclusiveStartKey: lastEvaluated
        ? {
            id: DynamoDB.Converter.marshall({ lastEvaluated }),
          }
        : undefined,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": {
          S: userId,
        },
      },
    })
    .promise();

  const lists = data.Items?.map((list) =>
    DynamoDB.Converter.unmarshall(list)
  ).map((list) => {
    list.uuid = list.id;
    delete list.userId;
    delete list.id;
    return list;
  }) as
    | [{ uuid: string; name: string; order: number; tasks: Array<any> }]
    | undefined;

  if (lists) {
    for (let list of lists) {
      const data = await client
        .query({
          TableName: "Tasks",
          IndexName: "indexListUuid",
          KeyConditionExpression: "listUuid = :listUuid",
          ExpressionAttributeValues: {
            ":listUuid": {
              S: list.uuid,
            },
          },
        })
        .promise();
      data?.Items?.forEach((task) => {
        const formattedTask = DynamoDB.Converter.unmarshall(task);
        formattedTask.uuid = formattedTask.id;
        delete formattedTask.id;
        delete formattedTask.listUuid;
        lists[list.order].tasks.push(formattedTask);
      });
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: lists,
    }),
  };
};
