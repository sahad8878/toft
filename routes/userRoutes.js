const express = require("express");
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
  // logoutUser,
} = require("../controllers/userController");
const router = express.Router();

router.get("/", homeView);
router.get('/men',menView)
router.get('/women',womenView)
router.get('/about',aboutView)
router.get('/contact',contactView)
router.get('/cart',cartView)
router.get("/register", registerView);
router.get("/login", loginView);
router.post("/loginUser", loginUser);
router.post("/registerUser",registerUser);
router.get('/logoutUser', homeView);
module.exports = router;
