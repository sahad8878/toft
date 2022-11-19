// const product = require('../models/product');
const Product= require('../models/product')
const User= require('../models/user')
const upload =require('../middlewares/multer')


//  login page
const loginView= (req, res) => {
if (req.session.adminLogedIn) {
  console.log(req.session.adminLogedIn);
  res.redirect("/admin/dashboard");
}else{
  res.render("admin/login",{adminLoggErr: req.session.adminLoggErr});
  req.session.adminLoggErr = false
}
};

//  admin login
const password="111"
const email ="admin@gmail.com"
 
const loginAdmin= (req, res) => {
// console.log(req.body.email,"//",req.body.password);
if ( req.body.email==email && req.body.password ==password) {
   req.session.adminLogedIn = true
 res.redirect("admin/dashboard");
}else{
  res.redirect("/admin");
  req.session.adminLoggErr=true
}
}


//  dashboard page 
const dashboardView= (req, res) => {
  res.render("admin/dashboard");

};

//  add product page
const addProduct= (req, res) => {
    res.render("admin/add_products");
  };
  //  product view
  const prodcutManagememnt= (req, res) => {
    Product.find().then(product =>{
      // console.log(product)
      res.render("admin/product_management",{product});
    }).catch(err =>{
      console.log(err);
    }) 
  };

  const addProductButton=  async (req, res) => {
    
    Object.assign(req.body,{imageUrl:req.files})

   console.log(req.body);
   

    const newProduct = await new Product(req.body);
    newProduct.save().then(result=>{
      console.log('created product');
        res.redirect('/admin/addProduct')
    })
    .catch(err=>{
      console.log(err);
    })
  }

  //  order page
  const ordersView= (req, res) => {
    res.render("admin/orders");
  };
  //  client  page
  const clientView= (req, res) => {

    User.find().then(user =>{
      res.render("admin/clients",{user});
    }).catch(err =>{
      console.log(err);
    }) 
    
  };

  // edit product

  const viewEditProduct = (req, res) => {

    const proId=req.params.id 
    Product.findById(proId).then(product =>{
      res.render("admin/edit_product",{product,proId});
    })
    
  }


  const editProduct = (req, res) => {
const proId=req.params.id 

const updateName=req.body.name
const updatePrace=req.body.price
const updateImageUrl=req.files
const updateDescription=req.body.description
const updateBrand=req.body.brand
// Object.assign(req.body,{imageUrl:req.file.filename})

Product.findById(proId).then(product =>{
  product.name=updateName;
  product.price=updatePrace;
  product.imageUrl=updateImageUrl
 product.description=updateDescription
 product.brand=updateBrand
return product.save()

}).then(result =>{
  console.log('updated product');
 res.redirect("/admin/product");
  }).catch(err =>console.log(err));
}


// delete product
const deleteProduct=(req,res)=>{
 const proId=req.params.id
console.log(proId) ;
Product.findByIdAndRemove(proId).then(product=>{
  console.log('product deleted');
    res.redirect('/admin/product')
});
  
}
// log out
const logoutButton = (req, res)=>{
  req.session.destroy();
  res.redirect('/admin');
}

// block user
const blockUser=(req, res)=>{
const userId=req.params.id
// console.log(userId)
User.findByIdAndUpdate(userId,{access:false},(err,data)=>{
if(err){
  console.log(err)
}else{
  res.redirect('/admin/clients')
}
})
}
const unBlockUser=(req, res)=>{
  const userId=req.params.id
  console.log(userId)
  User.findByIdAndUpdate(userId,{access:true},(err,data)=>{
  if(err){
    console.log(err)
  }else{
    res.redirect('/admin/clients')
  }
  })
}
module.exports={
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
}