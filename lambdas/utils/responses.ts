const headers = { "Content-Type": "application/json" };

export const statusSuccess = () => ({
  statusCode: 200,
  headers,
  body: JSON.stringify({
    message: "success",
  }),
});

export const statusCreate = () => ({
  statusCode: 201,
  headers,
  body: JSON.stringify({
    message: "success",
  }),
});

export const statusFail = (message: string = "Bad Request") => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({
    message,
  }),
});

export const statusForbidden = () => ({
  statusCode: 403,
  headers,
  body: JSON.stringify({
    message: "Forbidden",
  }),
});
