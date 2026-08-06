const multer = require("multer");
const { apierror } = require("./errorhandler");

// keep file in memory, we stream it straight to cloudinary
// no disk writes = nothing to clean up, works fine on render free tier
const storage = multer.memoryStorage();

const filefilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new apierror(400, "only image files allowed"));
};

const upload = multer({
  storage,
  fileFilter: filefilter,
  limits: { fileSize: parseInt(process.env.MAX_PHOTO_SIZE_MB) * 1024 * 1024 },
});

module.exports = upload;