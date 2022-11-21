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
addToCart
} = require("../controllers/userController");
const router = express.Router();
  // get routes
router.get("/", homeView);
router.get('/men',menView)
router.get('/women',womenView)
router.get('/about',aboutView)
router.get('/contact',contactView)
router.get("/register",noSession, registerView);
router.get("/login",noSession, loginView);
router.get('/logoutUser',logoutUser );
router.get('/productDetails/:id',upload.array("imageUrl",3), productDetails);
router.get("/Otp",getOtp);
router.get('/cart',userSession,cartView)

// post routes
router.post("/loginUser", loginUser);
router.post("/registerUser",registerUser);
router.post("/Otp",postOtp);
router.post('/cart/:id',userSession,addToCart)

module.exports = router;
