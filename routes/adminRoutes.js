const express = require("express"); 
const upload =require('../middlewares/multer')
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
errorPage,
}= require("../controllers/adminController")
const router = express.Router();


// post routers
router.post('/',loginAdmin)
router.post('/product',session,upload.array("imageUrl",3),addProductButton);
router.post('/editProduct/:id',session,upload.array("imageUrl",3),editProduct)
router.post('/category',session,session,upload.array("imageUrl",3),postAddCategory)


//  get routers
router.get('/',loginView)
router.get('/getEditProduct/:id',session,viewEditProduct)
router.get('/deleteProduct/:id',session,deleteProduct)
router.get('/dashboard',session,dashboardView)
router.get('/clients',session,clientView)
router.get('/addProduct',session,addProduct)
router.get('/product',session,prodcutManagememnt)
router.get('/orders',session,ordersView)
router.get('/logout',logoutButton)
router.get('/block/:id',session,blockUser)
router.get('/unBlock/:id',session,unBlockUser)
router.get('/error',errorPage)
router.get('/category',session,getCategory)
router.get('/addCategory',session,getAddCategory)

router.get('/deleteCategory/:id',deleteCategory)


module.exports = router;











