const user = require("../models/user");
require("../models/category"); // registers category model so populate can find it
const cloudinary = require("../config/cloudinary");
const { apierror } = require("../middlewares/errorhandler");

// pull enums straight from the schema - one source of truth, no copy paste
const enums = {
  language: user.schema.path("language").enumValues,
  role: user.schema.path("role").enumValues,
  availability: user.schema.path("workerprofile.availability").enumValues,
  education: user.schema.path("workerprofile.education").enumValues,
  paytype: user.schema.path("workerprofile.expectedpay.type").enumValues,
  hirertype: user.schema.path("hirerprofile.hirertype").enumValues,
};

// geojson sanity - [lng, lat] in valid ranges
const isvalidlocation = (loc) => {
  if (!loc || loc.type !== "Point" || !Array.isArray(loc.coordinates)) return false;
  const [lng, lat] = loc.coordinates;
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    lng >= -180 && lng <= 180 &&
    lat >= -90 && lat <= 90
  );
};

// whitelist based patch - anything not handled here gets silently ignored
const updateme = async (req, res, next) => {
  try {
    const updates = {};
    const { name, language, addresstext, location, role, workerprofile, hirerprofile } = req.body;

    if (name !== undefined) {
      const clean = String(name).trim();
      if (!clean) throw new apierror(400, "name cannot be empty");
      updates.name = clean;
    }

    if (language !== undefined) {
      if (!enums.language.includes(language)) throw new apierror(400, "invalid language");
      updates.language = language;
    }

    if (addresstext !== undefined) updates.addresstext = String(addresstext).trim();

    if (location !== undefined) {
      if (!isvalidlocation(location))
        throw new apierror(400, "location must be a geojson point with [lng, lat]");
      updates.location = { type: "Point", coordinates: location.coordinates };
    }

    if (role !== undefined) {
      if (!enums.role.includes(role)) throw new apierror(400, "invalid role");
      updates.role = role;
    }

    // dot notation so sending one subfield doesn't wipe the rest
    if (workerprofile !== undefined) {
      const { skills, experienceyears, availability, expectedpay, education } = workerprofile;

      if (skills !== undefined) {
        if (!Array.isArray(skills)) throw new apierror(400, "skills must be an array of category ids");
        updates["workerprofile.skills"] = skills;
      }
      if (experienceyears !== undefined) {
        const years = Number(experienceyears);
        if (isNaN(years) || years < 0) throw new apierror(400, "invalid experience years");
        updates["workerprofile.experienceyears"] = years;
      }
      if (availability !== undefined) {
        if (!enums.availability.includes(availability)) throw new apierror(400, "invalid availability");
        updates["workerprofile.availability"] = availability;
      }
      if (expectedpay !== undefined) {
        const amount = Number(expectedpay.amount);
        if (isNaN(amount) || amount < 0) throw new apierror(400, "invalid expected pay amount");
        if (!enums.paytype.includes(expectedpay.type)) throw new apierror(400, "invalid expected pay type");
        updates["workerprofile.expectedpay"] = { amount, type: expectedpay.type };
      }
      if (education !== undefined) {
        if (!enums.education.includes(education)) throw new apierror(400, "invalid education");
        updates["workerprofile.education"] = education;
      }
    }

    if (hirerprofile !== undefined) {
      const { hirertype, businessname } = hirerprofile;

      if (hirertype !== undefined) {
        if (!enums.hirertype.includes(hirertype)) throw new apierror(400, "invalid hirer type");
        updates["hirerprofile.hirertype"] = hirertype;
      }
      if (businessname !== undefined)
        updates["hirerprofile.businessname"] = String(businessname).trim();
    }

    if (Object.keys(updates).length === 0) throw new apierror(400, "nothing to update");

    const updated = await user.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
};

// public view - no phone, blocked users look like they don't exist
const getpublicprofile = async (req, res, next) => {
  try {
    const account = await user
      .findById(req.params.id)
      .select("name role language addresstext photo workerprofile hirerprofile ratingsummary createdAt")
      .populate("workerprofile.skills", "namekey icon");

    if (!account || account.isblocked) throw new apierror(404, "user not found");

    res.status(200).json({ success: true, user: account });
  } catch (err) {
    next(err);
  }
};

// upload to cloudinary, then delete the old one so free storage stays clean
const uploadphoto = async (req, res, next) => {
  try {
    if (!req.file) throw new apierror(400, "photo file required");

    const size = parseInt(process.env.PROFILE_PHOTO_SIZE_PX);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${process.env.CLOUDINARY_FOLDER}/profiles`,
          // square crop centered on the face - clean avatars, small size for 2g
          transformation: [{ width: size, height: size, crop: "fill", gravity: "face" }],
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const oldpublicid = req.user.photo && req.user.photo.publicid;

    const updated = await user.findByIdAndUpdate(
      req.user._id,
      { $set: { photo: { url: result.secure_url, publicid: result.public_id } } },
      { new: true }
    );

    // old photo cleanup - if this fails we don't fail the request
    if (oldpublicid) {
      await cloudinary.uploader.destroy(oldpublicid).catch(() => {});
    }

    res.status(200).json({ success: true, photo: updated.photo });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateme, getpublicprofile, uploadphoto };