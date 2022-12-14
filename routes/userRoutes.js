const express = require("express");
const upload =require('../middlewares/multer')
const Product = require("../models/product");
const {menPagination,womenPagination}=require('../middlewares/pagination')
const {userSession ,noSession, checkBlock}= require('../middlewares/userSession')
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
  resendOtp,
  postOtp,
  logoutUser,
  addToCart,
  deleteCartProduct,
  cartChangeQuantity,
  getCheckout,
  postCheckout,
  getProfile,
  getAddress,
  postAdress,
  deleteAddress,
  getEditAddress,
  postEditAddress,
  verifyPayment,
  paymentFailed,
  getOrderComplete,
  getMyOrder,
  getOrderDetails,
  cancelOrder,
  returnOrder,
  verifyCoupon,
  requistRefund,
  postReview

} = require("../controllers/userController");
const router = express.Router();


  // get routes
router.get("/",homeView) ;
router.get('/men',menPagination(Product),menView)
router.get('/women',womenPagination(Product), womenView)
router.get('/about',aboutView)
router.get('/contact',contactView)
router.get("/register", registerView);
router.get("/login",noSession, loginView);
router.get('/logoutUser',logoutUser );
router.get('/productDetails/:id',upload.array("imageUrl",3), productDetails);
router.get("/Otp",getOtp);
router.get('/resendOtp',resendOtp);
router.get('/checkout',userSession,checkBlock,getCheckout)
router.get('/profile',userSession,checkBlock,getProfile)
router.get('/address',userSession,checkBlock,getAddress)
router.get('/order-complete',userSession,checkBlock,getOrderComplete)
router.get('/editAddress/:id',userSession,checkBlock,getEditAddress)
router.get('/myOrder',userSession,checkBlock,getMyOrder)
router.get('/orderDetails',userSession,checkBlock,getOrderDetails)
router.get("/cancelOrder",userSession,checkBlock,cancelOrder)


// post routes

router.post("/loginUser", loginUser);
router.post("/registerUser",registerUser);
router.post("/Otp",postOtp);
router.post('/cart/:id',userSession,checkBlock,addToCart)
router.post('/addAdress',userSession,checkBlock,postAdress)
router.post('/checkout/:CartId',userSession,checkBlock,postCheckout)
router.post('/editAddress/:id',userSession,checkBlock,postEditAddress)
router.post('/verifyPayment',userSession,checkBlock,verifyPayment)
router.post('/paymentFailed',userSession,checkBlock,paymentFailed)
router.post('/returnOrder',userSession,checkBlock,returnOrder)
router.post('/verifyCoupon',userSession,checkBlock,verifyCoupon)
router.post('/refund',userSession,checkBlock,requistRefund)
router.post('/review',userSession,checkBlock,postReview)


router.delete('/profile/',userSession,checkBlock,deleteAddress)
router
    .route('/cart/')
    .get(userSession,checkBlock,cartView )
    .patch(userSession,checkBlock,cartChangeQuantity )
    .delete(userSession,checkBlock,deleteCartProduct)



module.exports = router;
