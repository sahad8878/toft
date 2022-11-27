// const product = require('../models/product');
const Product = require("../models/product");
const User = require("../models/user");
const upload = require("../middlewares/multer");
const Category = require("../models/category");

//  login page
const loginView = (req, res) => {
  if (req.session.adminLogedIn) {
    console.log(req.session.adminLogedIn);
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/login", { adminLoggErr: req.session.adminLoggErr });
    req.session.adminLoggErr = false;
  }
};

//  admin login

const email= process.env.ADMIN_EMAIL
const password= process.env.ADMIN_PASSWORD

const loginAdmin = (req, res) => {
  // console.log(req.body.email,"//",req.body.password);
  if (req.body.email == email && req.body.password == password) {
    req.session.adminLogedIn = true;
    res.redirect("admin/dashboard");
  } else {
    res.redirect("/admin");
    req.session.adminLoggErr = true;
  }
};

//  dashboard page
const dashboardView = (req, res) => {
  res.render("admin/dashboard");
};

//  add product page
const addProduct =async (req, res) => {
  let category= await Category.find()
  res.render("admin/add_products",{category});
};
//  product view
// const prodcutManagememnt= (req, res) => {
//   Product.find().then(product =>{
//     // console.log(product)
//     res.render("admin/product_management",{product});
//   }).catch(err =>{
//     console.log(err);
//   })
// };

const prodcutManagememnt = async (req, res) => {
  try {
    let product = await Product.find();
    // console.log(product);
     let category= await Category.find()
    res.render("admin/product_management", { product,category });
  } catch (err) {
    // res.redirect("/error");
    console.log("product add error");
  }
};

const addProductButton = async (req, res) => {
  
  const{name,description,category,price,stock,brand} = req.body
  const imageUrl=req.files
  

 console.log(imageUrl);

 if(name&&description&&category&&price&&stock&&imageUrl&&brand){

  Object.assign(req.body, { imageUrl: req.files });

  console.log(req.body);

  const newProduct = await new Product(req.body);
  newProduct
    .save()
    .then((result) => {
      console.log("created product");
      res.redirect("/admin/addProduct");
    })
    .catch((err) => {
      console.log(err);
    });
  }else{
    res.redirect("/admin/getEditProduct");
    console.log("fill coloms");

  }
};

//  order page
const ordersView = (req, res) => {
  res.render("admin/orders");
};
//  client  page
const clientView = (req, res) => {
  User.find()
    .then((user) => {
      res.render("admin/clients", { user });
    })
    .catch((err) => {
      console.log(err);
    });
};

// edit product

const viewEditProduct = (req, res) => {
  const proId = req.params.id;
  Product.findById(proId).then((product) => {
    res.render("admin/edit_product", { product, proId });
  });
};

// edit product
const editProduct = (req, res) => {
  const proId = req.params.id;
  const imageUrl=req.files;
  console.log(imageUrl);
       const{name,price,description,category,brand,stock}= req.body
       if (name&&price&&description&&imageUrl&&category&&brand&&stock) {
        
  const updateName = name;
  const updatePrace =price;
  const updateImageUrl =imageUrl
  const updateDescription =description;
  const updateBrand =brand;
  const updateStock=stock
  // Object.assign(req.body,{imageUrl:req.file.filename})

  Product.findById(proId)
    .then((product) => {
      product.name = updateName;
      product.price = updatePrace;
      product.imageUrl = updateImageUrl;
      product.description = updateDescription;
      product.brand = updateBrand;
      product.stock = updateStock
      return product.save();
    })
    .then((result) => {
      console.log("updated product");
      res.redirect("/admin/product");
    })
    .catch((err) => console.log(err));
  }else{

    res.redirect("/admin/getEditProduct");
  console.log("fill the edit coloms");
  }
};

// delete product
const deleteProduct = (req, res) => {
  const proId = req.params.id;
  console.log(proId);
  Product.findByIdAndRemove(proId).then((product) => {
    console.log("product deleted");
    res.redirect("/admin/product");
  });
};
// log out
const logoutButton = (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
};

// block user
const blockUser = (req, res) => {
  const userId = req.params.id;
  // console.log(userId)
  User.findByIdAndUpdate(userId, { access: false }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin/clients");
    }
  });
};

// unBlock  User
const unBlockUser = (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  User.findByIdAndUpdate(userId, { access: true }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/admin/clients");
    }
  });
};

// Category page
const getCategory = async (req, res) => {
  try {
    let category = await Category.find();

    res.render("admin/category", { category });
  } catch (err) {
    res.redirect("/admin/error");
  }
};

// add get  category
const getAddCategory = (req, res) => {

  res.render("admin/add_category");
};

// add post  category
const postAddCategory = async(req, res) => {

  
  const category=req.body.category
  const imageUrl=req.files
  const reqCategory = req.body.category;

  if(category&&imageUrl){


console.log(reqCategory+" reqqqqqq");
  let dbCategory = await Category.findOne({category:reqCategory});
console.log(dbCategory+ "  dbgeeee");
     if(!dbCategory){

      Object.assign(req.body, { imageUrl: req.files });
  const newCategory = await new Category(req.body);
    await newCategory.save()
    .then((result) => {
      console.log("created category");
      res.redirect("/admin/addCategory");
    })
    .catch((err) => {
      console.log(err);
    });  
   }else{
    res.redirect("/admin/addCategory");
    console.log("allready exist");

   }
  }else{

    res.redirect("/admin/addCategory");
  }
  
};

// delete Category
const deleteCategory = (req, res) => {
  const proId = req.params.id;
  console.log(proId);
  Category.findByIdAndRemove(proId).then((category) => {
    console.log("category deleted");
    res.redirect("/admin/category");
  });
 
};

// error page
const errorPage = (req, res) => {
  res.render("admin/error");
};

module.exports = {
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
  errorPage,
  getCategory,
  getAddCategory,
  postAddCategory,

  deleteCategory,
};
