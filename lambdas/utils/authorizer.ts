import { APIGatewayProxyEvent } from "aws-lambda";
import { verify } from "jsonwebtoken";

interface JwtPayload {
  uuid: string;
  iat: number;
}

export const isAuthorized = (event: APIGatewayProxyEvent, uuid?: string) => {
  try {
    const header = event.headers?.Authorization?.split(" ")[1];
    if (!header) return false;
    const token = verify(header, "thisisthejwtsecret") as JwtPayload;
    if (uuid && token?.uuid !== uuid) return false;
    return true;
  } catch {
    return false;
  }
};

export const getUserId = (event: APIGatewayProxyEvent) => {
  const header = event.headers?.Authorization?.split(" ")[1];
  if (!header) return;
  const token = verify(header, "thisisthejwtsecret") as JwtPayload;
  return token?.uuid;
};
