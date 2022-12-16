// const product = require('../models/product');
const Product = require("../models/product");
const User = require("../models/user");
const upload = require("../middlewares/multer");
const bannerImages = require("../middlewares/bannerMulter");
const Category = require("../models/category");
const Order = require("../models/order");
const moment = require("moment");
const Banner = require("../models/banner");
const Coupon = require("../models/coupon");
const { AwsPage } = require("twilio/lib/rest/accounts/v1/credential/aws");




//  login page
const loginView = (req, res) => {
  try {
    if (req.session.adminLogedIn) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("admin/login", { adminLoggErr: req.flash("adminLogErr") });
      // req.session.adminLoggErr = false;
    }
  } catch (error) {
    res.render("admin/error");
  }
};

//  admin login
const loginAdmin = (req, res) => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    // console.log(req.body.email,"//",req.body.password);
    if (req.body.email == email && req.body.password == password) {
      req.session.adminLogedIn = true;
      res.redirect("admin/dashboard");
    } else {
      req.flash("adminLogErr", "wrong email or password");
      res.redirect("/admin");
      req.session.adminLoggErr = true;
    }
  } catch (error) {
    res.render("admin/error");
  }
};

//  dashboard page
const dashboardView = async(req, res) => {
  try {

    let order= await Order.find()
    let orderCount=order.length
    let user=await User.find()
let  usersCount=user.length
 const total= await  Order.aggregate([ { 
  $group: { 
      _id: order._id, 
      total: { 
          $sum: "$total"
      } 
  } 
} ] )
const totalProfit=total[0].total
await Order.aggregate([
  {
    $match: {
      paymentStatus: 'Payment Pending',
    },
  },
  {
    $count: 'Count',
  },
]).then((result) => {
  if (result.length != 0) {
  pendingCount = result[0].Count;
  }
});
    res.render("admin/dashboard",{orderCount,usersCount,totalProfit,pendingCount,dashboard:true});
  } catch (error) {
    res.render("admin/error");
  }
};

//  product view

const prodcutManagememnt = async (req, res) => {
  try {
    let product = await Product.find().sort({ updatedAt: -1 });
    let category = await Category.find();
    res.render("admin/product_management", { product, category ,productView:true});
  } catch (error) {
    res.render("admin/error");
  }
};
// get add product page
const addProduct = async (req, res) => {
  try {
    let category = await Category.find();
    res.render("admin/add_products", {
      category,
      proAddErr: req.flash("proAddErr"),
      productView:true
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// post add product page
const addProductButton = async (req, res) => {
  try {
    const { name, description, category, price, stock, brand } = req.body;

    const img = [];
    req.files.forEach((el) => {
      img.push(el.filename);
    });

    if (
      name &&
      description &&
      category &&
      price &&
      stock &&
      img.length > 0 &&
      brand
    ) {
      Object.assign(req.body, {
        imageUrl: img,
        updatedAt: moment().format("MM/DD/YYYY"),
      });

      const newProduct = await new Product(req.body);
      newProduct
        .save()
        .then((result) => {
          res.redirect("/admin/addProduct");
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      req.flash("proAddErr", "fill full coloms");
      res.redirect("/admin/addProduct");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

//  order page
const ordersView = async (req, res) => {
  try {
    let order = await Order.find().sort({ updatedAt: -1 }).populate("userId");
    Object.values(order);
    res.render("admin/orders", { order, user: req.session.user ,ordersView:true});
  } catch (error) {
    res.render("admin/error");
  }
};

// get order details

const getOrderDetails= async(req,res)=>{
  try{
 let order = await Order.findOne({_id:req.params.id}).populate("products.product");
   res.render('admin/orderDetails',{order,ordersView:true})
  } catch (error) {
    res.render("admin/error");
  }
 }
 
//  change order status

const changeTrack= async (req, res) => {
  try{
  oid = req.body.orderId;
  value = req.body.value;
  if (value == 'Delivered') {
    await Order.updateOne(
      {
        _id: oid,
      },
      {
        $set: {
          track: value,
          orderStatus: value,
          paymentStatus: 'Payment Completed',
        },
      }
    ).then((response) => {
      res.json({ status: true });

    });
  } else {
    await Order.updateOne(
      {
        _id: oid,
      },
      {
        $set: {
          track: value,
          orderStatus: value,
        },
      }
    ).then((response) => {
      res.json({ status: true });
    });
  }
} catch (error) {
  res.render("admin/error");
}
}

//  client  page
const clientView = (req, res) => {
  try {
    User.find()
      .sort({ updatedAt: -1 })
      .then((user) => {
        res.render("admin/clients", { user ,clientView:true});
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    res.render("admin/error");
  }
};

// edit product

const viewEditProduct = (req, res) => {
  try {
    const proId = req.params.id;
    Product.findById(proId).then((product) => {
      res.render("admin/edit_product", {
        product,
        proId,
        proEditErr: req.flash("proEditErr"),
        productView:true
      });
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// edit product
const editProduct = async (req, res) => {
  try {
    var proId = req.params.id;
    const { name, price, description, category, brand, stock } = req.body;
    if (name && price && description && category && brand && stock) {

      if (req.files.length === 0) {
        await Product.findByIdAndUpdate(proId, req.body, {
          upsert: true,
          new: true,
          runValidators: true,
        });
        res.redirect("/admin/product");
      } else {
        var img = [];
        req.files.forEach((el) => {
          img.push(el.filename);
        });

        Object.assign(req.body, {
          imageUrl: img,
          updatedAt: moment().format("MM/DD/YYYY"),
        });
        await Product.findByIdAndUpdate(proId, req.body, {
          upsert: true,
          new: true,
          runValidators: true,
        });
        res.redirect("/admin/product");
      }
    } else {
      req.flash("proEditErr", "fill the edit coloms");
      res.redirect(`/admin/getEditProduct/${proId}`);
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// delete product
const deleteProduct = (req, res) => {
  try {
    const proId = req.params.id;
    Product.findByIdAndRemove(proId).then((product) => {
      res.redirect("/admin/product");
    });
  } catch (error) {
    res.render("admin/error");
  }
};
// log out
const logoutButton = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    res.render("admin/error");
  }
};

// block user
const blockUser = (req, res) => {
  try{
  const userId = req.params.id;
  User.findByIdAndUpdate(userId, { access: false }, (err, data) => {
    if (err) {
      console.log(err);
      res.render("admin/error");
    } else {
      res.redirect("/admin/clients");
    }
  });
} catch (error) {
  res.render("admin/error");
}
};

// unBlock  User
const unBlockUser = (req, res) => {
  try{
  const userId = req.params.id;
  User.findByIdAndUpdate(userId, { access: true }, (err, data) => {
    if (err) {
      console.log(err);
      res.render("admin/error");
    } else {
      res.redirect("/admin/clients");
    }
  });
} catch (error) {
  res.render("admin/error");
}
};

// Category page
const getCategory = async (req, res) => {
  try {
    let category = await Category.find().sort({ updatedAt: -1 });
    res.render("admin/category", { category,categoryView:true });
  } catch (error) {
    res.render("admin/error");
  }
};

// add get  category
const getAddCategory = (req, res) => {
  try {
    res.render("admin/add_category", {
      catAddErr: req.flash("catAddErr"),
      catExistErr: req.flash("catExistErr"),
      categoryView:true
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// add post  category
const postAddCategory = async (req, res) => {
  try {
   
    const imageUrl = req.files;
    const reqCategory = req.body.category;
    if (reqCategory && imageUrl) {
      let regExp=new RegExp(reqCategory,'i')
      let dbCategory = await Category.findOne({ category: {$regex:regExp}});
      
      console.log(dbCategory);
      if (!dbCategory) {
          
    
        Object.assign(req.body, { imageUrl: req.files });
        const newCategory = await new Category(req.body);
        await newCategory
          .save()
          .then((result) => {
            console.log("created category");
            res.redirect("/admin/addCategory");
          })
          .catch((err) => {
            console.log(err);
          });
        
      } else {
        req.flash("catExistErr", "Category already exists");
        res.redirect("/admin/addCategory");
        console.log("allready exist");
      }
    } else {
      req.flash("catAddErr", "Fill full coloms");
      res.redirect("/admin/addCategory");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// delete Category
const deleteCategory = (req, res) => {
  try {
    const proId = req.params.id;
    Category.findByIdAndRemove(proId).then((category) => {
      res.redirect("/admin/category");
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// get banner page
const getBanner =async (req, res) => {
try{
  let banner = await Banner.find({ delete: { $ne: true } }).sort({ updatedAt: -1 });
  res.render("admin/bannerManagment",{banner,bannerView:true});
} catch (error) {
  res.render("admin/error");
}
}
// get add banner
const getAddBanner = (req, res) => {
  try{
  res.render("admin/add_banner",{bannerAddErr: req.flash("bannerAddErr"),bannerView:true});
} catch (error) {
  res.render("admin/error");
}
}

// post add  banner
const postAddBanner = async(req, res) => {
  try{
const imageUrl = req.files;
const { description,head1,head2,head3,route } = req.body;
if( description&&head1&&head2&&head3&&route&&imageUrl){

  Object.assign(req.body, { imageUrl:req.files });
const newBanner =await new Banner(req.body);
await newBanner.save().then((result) => {

  res.redirect('/admin/banner');
});
}else{
  console.log("fill the banner coloms");
  req.flash("bannerAddErr", "Fill full coloms");
  res.redirect('/admin/addBanner')
}
} catch (error) {
  res.render("admin/error");
}
}

// delete banner
const deleteBanner=async(req,res)=>{
try{
  const id = req.query.id;
  const deleteBanner = await Banner.findOneAndUpdate(
    { _id: id },
    { $set: { delete: true } }
  );
  deleteBanner.save().then(() => {
    res.json('success')
  });
} catch (error) {
  res.render("admin/error");
}
}


// get coupon

const getCoupon= async (req, res) => {
try{
const coupons=await Coupon.find().sort({ updatedAt: -1 });
  res.render("admin/coupon",{coupons,couponView:true})
} catch (error) {
  res.render("admin/error");
}
}



// get add coupon page

const getAddCoupon= async (req, res) => {
try{
  res.render("admin/add-coupon",{addCouponErr:req.flash("addCouponErr"),couponView:true})
} catch (error) {
  res.render("admin/error");
}
}

// post add coupoon 
const postAddCoupon=(req,res) => {
  try{
 const {code,CouponType,cutOff,minAmount,maxAmount,genetateCount,expireDate}=req.body
if (code&&CouponType&&cutOff&&minAmount&&maxAmount&&genetateCount&&expireDate) {
  Coupon.find({ code: code }).then((result) => {
    if (result.length == 0) {
      const  coupon = new Coupon({
        code: code,
        cutOff: cutOff,
        couponType: CouponType,
        minCartAmount: minAmount,
        maxRedeemAmount:maxAmount,
        generateCount: genetateCount,
        expireDate: expireDate,
      });
      coupon.save().then((result) => {
        res.redirect('/admin/coupon');
      });
    } else {
      couponExistErr = 'Coupon Already Exist';
      res.redirect('/admin/addcoupon');
    }
  });

}else{
console.log("fill ful coloms");
req.flash("addCouponErr","fill full coloms")
  res.redirect("/admin/addCoupon")
}
} catch (error) {
  res.render("admin/error");
}
}

// delete coupon

const deleteCoupen=(req,res) => {
try{
  const coupenId = req.query.id;
  Coupon.findByIdAndRemove(coupenId).then((coupon) => {
    res.json('success')
  });
} catch (error) {
  res.render("admin/error");
}
}

// active coupon

const  couponActive=async(req,res)=>{
try{

  coupenId = req.query.id;
  await Coupon.updateOne(
    { _id: coupenId },
    { $set: { status: 'ACTIVE' } }
  ).then((result) => {
    res.redirect('/admin/coupon');
  });
} catch (error) {
  res.render("admin/error");
}
}


// block coupon

const couponBlock= async (req, res) => {
try{
  coupenId = req.query.id;
  await Coupon.updateOne(
    { _id: coupenId },
    { $set: { status: 'BLOCK' } }
  ).then((result) => {
    res.redirect('/admin/coupon');
  });
} catch (error) {
  res.render("admin/error");
}
}

// get chart details

const GetChartDetails=(req,res)=>{

}

// get sales report

const salesReport=async(req,res)=>{
  try{
  const salesReport = await Order.aggregate(
    [{
      $match : { 'orderStatus' : { $ne: 'Cancelled'}}
    },
    {
        $group : {
            _id : { month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" }, year: { $year: "$createdAt" } },
            totalPrice: { $sum:  "$total"  },
            products: { $sum :{$size: "$products"}},
            count: { $sum: 1 },
            
                }

            },{$sort:{updatedAt:-1}}
    ])
  // const filterOrder = await Order.find({})
res.render('admin/sales_report',{salesReport,})
} catch (error) {
  res.render("admin/error");
}
}

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
   salesReport

};
