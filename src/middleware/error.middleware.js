export const errorHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    response.status(409).json({ error: "A record with that value already exists." });
    return;
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    response.status(400).json({ error: error.message });
    return;
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) {
    console.error(error);
    response.status(500).json({ error: "An unexpected server error occurred." });
    return;
  }

  response.status(status).json({ error: error.message });
};
