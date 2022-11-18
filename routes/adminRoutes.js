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
logoutButton
}= require("../controllers/adminController")
const router = express.Router();


router.get('/',loginView)

router.post('/',loginAdmin)
router.post('/product',session,upload.array("imageUrl",3),addProductButton);
router.post('/editProduct/:id',session,upload.array("imageUrl",3),editProduct)

router.get('/editProduct/:id',session,viewEditProduct)
router.get('/deleteProduct/:id',session,deleteProduct)
router.get('/dashboard',session,dashboardView)
router.get('/clients',session,clientView)
router.get('/addProduct',session,addProduct)
router.get('/product',session,prodcutManagememnt)
router.get('/orders',session,ordersView)
router.get('/logout',logoutButton)


module.exports = router;











