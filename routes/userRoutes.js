const express = require("express");
const upload =require('../middlewares/multer')
const {userSession ,noSession}= require('../middlewares/userSession')
const {
  homeView,
  menView,
  womenView,
  aboutView,
  contactView,
  cartView,
  loginView,
  loginUser,
  registerView,
  registerUser,
  productDetails,
  getOtp,
  postOtp,
logoutUser,
} = require("../controllers/userController");
const router = express.Router();

router.get("/", homeView);
router.get('/men',menView)
router.get('/women',womenView)
router.get('/about',aboutView)
router.get('/contact',contactView)
router.get('/cart',userSession,cartView)
router.get("/register",noSession, registerView);
router.get("/login",noSession, loginView);
router.post("/loginUser", loginUser);
router.post("/registerUser",registerUser);
router.get('/logoutUser',logoutUser );
router.get('/productDetails/:id',upload.array("imageUrl",3), productDetails);


router.get("/Otp",getOtp);
router.post("/Otp",postOtp);

module.exports = router;
