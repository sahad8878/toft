const multer=require('multer')

const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images");
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `img-${file.fieldname}-${Date.now()}.${ext}`);
    },
  });
  const upload = multer({
    storage: multerStorage,
    // fileFilter: multerFilter,
  });
  module.exports=upload