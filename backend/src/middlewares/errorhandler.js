// central error handler - controllers pass errors here via next(err)

const errorhandler = (err, req, res, next) => {
  console.error(err.stack);

  let statuscode = err.statuscode || 500;
  let message = err.message || "something went wrong";

  // mongoose bad objectid
  if (err.name === "CastError") {
    statuscode = 400;
    message = "invalid id format";
  }

  // mongoose validation errors
  if (err.name === "ValidationError") {
    statuscode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // duplicate key (unique index hit)
  if (err.code === 11000) {
    statuscode = 409;
    message = `duplicate value for ${Object.keys(err.keyValue).join(", ")}`;
  }

  // multer upload errors (file too big etc)
  if (err.name === "MulterError") {
    statuscode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? `file too large, max ${process.env.MAX_PHOTO_SIZE_MB}mb allowed`
        : err.message.toLowerCase();
  }

  res.status(statuscode).json({
    success: false,
    message,
    // stack only in dev, never leak in prod
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// throw errors with a status code from controllers
class apierror extends Error {
  constructor(statuscode, message) {
    super(message);
    this.statuscode = statuscode;
  }
}

module.exports = { errorhandler, apierror };