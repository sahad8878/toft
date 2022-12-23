const express = require("express"); 
const upload =require('../middlewares/multer')
const bannerImages=require('../middlewares/bannerMulter')
const {session }= require('../middlewares/adminSession')
const {
loginView,
loginAdmin,
dashboardView,
addProduct,
addProductButton,
prodcutManagememnt,
ordersView,
clientView,
viewEditProduct,
editProduct,
deleteProduct,
logoutButton,
blockUser,
unBlockUser,
getCategory, 
getAddCategory,
postAddCategory,
deleteCategory,
getEditCategory,
postEditCategory,
errorPage,
getBanner,
getAddBanner,
postAddBanner,
deleteBanner,
getOrderDetails,
changeTrack,
getCoupon,
getAddCoupon,
postAddCoupon,
deleteCoupen,
couponActive,
couponBlock,
GetChartDetails,
pieChart,
salesReport,
MonthReport,
yearReport,

}= require("../controllers/adminController")
const router = express.Router();


// post routers
router.post('/',loginAdmin)
router.post('/product',session,upload.array("imageUrl",3),addProductButton);
router.post('/editProduct/:id',session,upload.array("imageUrl",3),editProduct)
router.post('/category',session,upload.array("imageUrl",3),postAddCategory)
router.post('/orderStatus',session,changeTrack)
router.post('/postEditCategory/:id',session,upload.array("imageUrl",3),postEditCategory)


//  get routers
router.get('/',loginView)
router.get('/getEditProduct/:id',session,upload.array("imageUrl",3),viewEditProduct)
router.get('/deleteProduct/:id',session,deleteProduct)
router.get('/dashboard',session,dashboardView)
router.get('/clients',session,clientView)
router.get('/addProduct',session,upload.array("imageUrl",3),addProduct)
router.get('/product',session,upload.array("imageUrl",3),prodcutManagememnt)
router.get('/orders',session,ordersView)
router.get('/logout',logoutButton)
router.get('/block/:id',session,blockUser)
router.get('/unBlock/:id',session,unBlockUser)
router.get('/error',errorPage)
router.get('/category',session,getCategory)
router.get('/addCategory',session,getAddCategory)
router.get('/deleteCategory/:id',session,deleteCategory)
router.get('/getEditCategory/:id',session,getEditCategory)
router.get('/addBanner',session,bannerImages.array("imageUrl",3),getAddBanner)
router.get('/orderDetails/:id',session,getOrderDetails)
router.get('/addCoupon',session,getAddCoupon)
router.get('/couponActive',session,couponActive)
router.get('/couponBlock',session,couponBlock)
router.get('/ChartDetails',session,GetChartDetails)
router.get('/salesReport',session,salesReport)
router.get('/monthReport',session,MonthReport)
router.get('/yearReport',session,yearReport)
router.get('/pieChart',session,pieChart)

// chain router
router.
route('/banner/')
.get(session,bannerImages.array("imageUrl",3),getBanner)
.post(session,bannerImages.array("imageUrl",3),postAddBanner)
.delete(session,deleteBanner)

router.
route('/coupon/')
.get(session,getCoupon)
.post(session,postAddCoupon)
.delete(session,deleteCoupen)

module.exports = router;











