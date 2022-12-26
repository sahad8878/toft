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
const { response } = require("express");
const { find } = require("../models/user");

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
const dashboardView = async (req, res) => {
  try {
    let order = await Order.find();
    let orderCount = order.length;
    let user = await User.find();
    let usersCount = user.length;
    const total = await Order.aggregate([
      {
        $group: {
          _id: order._id,
          total: {
            $sum: "$total",
          },
        },
      },
    ]);
    const totalProfit = total[0].total;
    await Order.aggregate([
      {
        $match: {
          paymentStatus: "Payment Pending",
        },
      },
      {
        $count: "Count",
      },
    ]).then((result) => {
      if (result.length != 0) {
        pendingCount = result[0].Count;
      }
    });
    res.render("admin/dashboard", {
      orderCount,
      usersCount,
      totalProfit,
      pendingCount,
      dashboard: true,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

//  order page
const ordersView = async (req, res) => {
  try {
    let order = await Order.find().sort({ updatedAt: -1 }).populate("userId");
    Object.values(order);
    res.render("admin/orders", {
      order,
      user: req.session.user,
      ordersView: true,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// get order details

const getOrderDetails = async (req, res) => {
  try {
    let order = await Order.findOne({ _id: req.params.id }).populate(
      "products.product"
    );
    res.render("admin/orderDetails", { order, ordersView: true });
  } catch (error) {
    res.render("admin/error");
  }
};

//  change order status

const changeTrack = async (req, res) => {
  try {
    oid = req.body.orderId;
    value = req.body.value;
    if (value == "Delivered") {
      await Order.updateOne(
        {
          _id: oid,
        },
        {
          $set: {
            track: value,
            orderStatus: value,
            paymentStatus: "Payment Completed",
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
};

//  client  page
const clientView = (req, res) => {
  try {
    User.find()
      .sort({ updatedAt: -1 })
      .then((user) => {
        res.render("admin/clients", { user, clientView: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    res.render("admin/error");
  }
};

//  product view

const prodcutManagememnt = async (req, res) => {
  try {
    let product = await Product.find().sort({ updatedAt: -1 });
    let category = await Category.find();
    res.render("admin/product_management", {
      product,
      category,
      productView: true,
    });
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
      productView: true,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// post add product page
const addProductButton = async (req, res) => {
  try {
    const { name, description, offer, category, price, stock, brand } = req.body;
  
    let img = [];
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
    
      const catOffer = await Category.findOne(
        { category: category },
        { _id: 0, offer: 1 }
      );
      const catOfferPercentage = catOffer.offer;
      const catOfferPrice = Math.round(
        price - (price * catOfferPercentage) / 100
      );  
    const proOfferPrice = Math.round(price - (price * offer) / 100);
      let discountPrice;
      if (catOfferPrice < proOfferPrice) {
        discountPrice = catOfferPrice;
      } else if (catOfferPrice > proOfferPrice) {
        discountPrice = proOfferPrice;
      } else {
      }

      Object.assign(req.body, {
        imageUrl: img,
        discountPrice: discountPrice,
      });

      const newProduct = await new Product(req.body);
      newProduct
        .save()
        .then((result) => {
          res.redirect("/admin/product");
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

// edit product

const viewEditProduct = (req, res) => {
  try {
    const proId = req.params.id;
    Product.findById(proId).then((product) => {
      res.render("admin/edit_product", {
        product,
        proId,
        proEditErr: req.flash("proEditErr"),
        productView: true,
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
    const { name, price, offer, description, category, brand, stock } =req.body;
    if (name && price && description && category && brand && stock) {
      const catOffer = await Category.findOne(
        { category: category },
        { _id: 0, offer: 1 }
      );
      const catOffPercentage = catOffer.offer;
      const catOfferPrice = Math.round(
        price - (price * catOffPercentage) / 100
      );
      const proOfferPrice = Math.round(price - (price * offer) / 100);
      let discountPrice;
      if (catOfferPrice < proOfferPrice) {
        discountPrice = catOfferPrice;
      } else if (catOfferPrice > proOfferPrice) {
        discountPrice = proOfferPrice;
      } else {
        discountPrice = 0;
      }

      if (req.files.length === 0) {
        Object.assign(req.body, {
          discountPrice: discountPrice,
          updatedAt: moment().format("MM/DD/YYYY"),
        });
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
          discountPrice: discountPrice,
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

// block user
const blockUser = (req, res) => {
  try {
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
  try {
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
    res.render("admin/category", { category, categoryView: true });
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
      categoryView: true,
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
      let regExp = new RegExp(reqCategory, "i");
      let dbCategory = await Category.findOne({ category: { $regex: regExp } });
      const img = [];
      imageUrl.forEach((el) => {
        img.push(el.filename);
      });

      if (!dbCategory) {
        Object.assign(req.body, { imageUrl: img });
        const newCategory = await new Category(req.body);
        await newCategory
          .save()
          .then((result) => {
            console.log("created category");
            res.redirect("/admin/category");
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

// get edit category

const getEditCategory = async (req, res) => {
  const catId = req.params.id;
  const category = await Category.findById(catId);
  res.render("admin/edit_category", {
    category,
    catEditErr: req.flash("catEditErr"),
  });
};

// post edit category

const postEditCategory = async (req, res) => {
  const catId = req.params.id;
  const { category, offer } = req.body;
  if (category) {
    if (req.files.length === 0) {
      const category = await Category.findByIdAndUpdate(catId, req.body, {
        upsert: true,
        new: true,
        runValidators: true,
      });
      await Product.updateMany({category: category.category,offer: { $gt: offer },},[{$set: {discountPrice: {$round: [{$subtract: ["$price",{$divide: [{ $multiply: ["$price", "$offer"] }, 100], },],},],}, }, },]);

      await Product.updateMany(
        {
          category: category.category,
          offer: { $lt: offer },
        },
        [
          {
            $set: {
              discountPrice: {
                $round: [
                  {
                    $subtract: [
                      "$price",
                      {
                        $divide: [
                          { $multiply: ["$price", Number(offer)] },
                          100,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ]
      );

      res.redirect("/admin/category");
    } else {
      var img = [];
      req.files.forEach((el) => {
        img.push(el.filename);
      });
      Object.assign(req.body, {
        imageUrl: img,
      });
      const category = await Category.findByIdAndUpdate(catId, req.body, {
        upsert: true,
        new: true,
        runValidators: true,
      });
      await Product.updateMany(
        {
          category: category.category,
          offer: { $gt: offer },
        },
        [
          {
            $set: {
              discountPrice: {
                $round: [
                  {
                    $subtract: [
                      "$price",
                      {
                        $divide: [{ $multiply: ["$price", "$offer"] }, 100],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ]
      );

      await Product.updateMany(
        {
          category: category.category,
          offer: { $lt: offer },
        },
        [
          {
            $set: {
              discountPrice: {
                $round: [
                  {
                    $subtract: [
                      "$price",
                      {
                        $divide: [
                          { $multiply: ["$price", Number(offer)] },
                          100,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ]
      );

      res.redirect("/admin/category");
    }
  } else {
    req.flash("catEditErr", "fill the edit coloms");
    res.redirect(`/admin/getEditCategory/${catId}`);
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
const getBanner = async (req, res) => {
  try {
    let banner = await Banner.find({ delete: { $ne: true } }).sort({
      updatedAt: -1,
    });
    res.render("admin/bannerManagment", { banner, bannerView: true });
  } catch (error) {
    res.render("admin/error");
  }
};
// get add banner
const getAddBanner = (req, res) => {
  try {
    res.render("admin/add_banner", {
      bannerAddErr: req.flash("bannerAddErr"),
      bannerView: true,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// post add  banner
const postAddBanner = async (req, res) => {
  try {
    const imageUrl = req.files;
    const { description, head1, head2, head3, route } = req.body;
    if (description && head1 && head2 && head3 && route && imageUrl) {
      Object.assign(req.body, { imageUrl: req.files });
      const newBanner = await new Banner(req.body);
      await newBanner.save().then((result) => {
        res.redirect("/admin/banner");
      });
    } else {
      console.log("fill the banner coloms");
      req.flash("bannerAddErr", "Fill full coloms");
      res.redirect("/admin/addBanner");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// delete banner
const deleteBanner = async (req, res) => {
  try {
    const id = req.query.id;
    const deleteBanner = await Banner.findOneAndUpdate(
      { _id: id },
      { $set: { delete: true } }
    );
    deleteBanner.save().then(() => {
      res.json("success");
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// get coupon

const getCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ timeStamp: -1 });
    res.render("admin/coupon", { coupons, couponView: true });
  } catch (error) {
    res.render("admin/error");
  }
};

// get add coupon page

const getAddCoupon = async (req, res) => {
  try {
    res.render("admin/add-coupon", {
      addCouponErr: req.flash("addCouponErr"),
      couponView: true,
      couponExistErr: req.flash("couponExistErr"),
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// post add coupoon
const postAddCoupon = async (req, res) => {
  try {
    const {
      code,
      CouponType,
      cutOff,
      minAmount,
      maxAmount,
      genetateCount,
      expireDate,
    } = req.body;
    if (
      code &&
      CouponType &&
      cutOff &&
      minAmount &&
      maxAmount &&
      genetateCount &&
      expireDate
    ) {
      let regExp = new RegExp(code, "i");

      const coupon = await Coupon.find({ code: { $regex: regExp } });
      if (coupon.length == 0) {
        const coupon = new Coupon({
          code: code,
          cutOff: cutOff,
          couponType: CouponType,
          minCartAmount: minAmount,
          maxRedeemAmount: maxAmount,
          generateCount: genetateCount,
          expireDate: expireDate,
        });
        coupon.save().then((result) => {
          res.redirect("/admin/coupon");
        });
      } else {
        couponExistErr = "Coupon Already Exist";
        req.flash("couponExistErr", "Coupon Already Exist");
        res.redirect("/admin/addcoupon");
      }
    } else {
      console.log("fill ful coloms");
      req.flash("addCouponErr", "fill full coloms");
      res.redirect("/admin/addCoupon");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// delete coupon

const deleteCoupen = (req, res) => {
  try {
    const coupenId = req.query.id;
    Coupon.findByIdAndRemove(coupenId).then((coupon) => {
      res.json("success");
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// active coupon

const couponActive = async (req, res) => {
  try {
    coupenId = req.query.id;
    await Coupon.updateOne(
      { _id: coupenId },
      { $set: { status: "ACTIVE" } }
    ).then((result) => {
      res.redirect("/admin/coupon");
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// block coupon

const couponBlock = async (req, res) => {
  try {
    coupenId = req.query.id;
    await Coupon.updateOne(
      { _id: coupenId },
      { $set: { status: "BLOCK" } }
    ).then((result) => {
      res.redirect("/admin/coupon");
    });
  } catch (error) {
    res.render("admin/error");
  }
};



// get sales report

const salesReport = async (req, res) => {
  try {
    const salesReport = await Order.aggregate([
      {
        $match: { orderStatus: { $eq: "Delivered" } },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalPrice: { $sum: "$total" },
          products: { $sum: { $size: "$products" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { date: -1 } },
    ]);

    // const filterOrder = await Order.find({})
    res.render("admin/sales_report", { salesReport });
  } catch (error) {
    res.render("admin/error");
  }
};

// month report
const MonthReport = async (req, res) => {
  try{
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const salesReport = await Order.aggregate([
    {
      $match: { orderStatus: { $eq: "Delivered" } },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        totalPrice: { $sum: "$total" },
        products: { $sum: { $size: "$products" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { date: -1 } },
  ]);
  const newSalesReport = salesReport.map((el) => {
    let newEl = { ...el };
    newEl._id.month = months[newEl._id.month - 1];
    return newEl;
  });
  res.render("admin/monthReport", { salesReport: newSalesReport });
} catch (error) {
  res.render("admin/error");
}
};

// year report
const yearReport = async (req, res) => {
  try {
    const salesReport = await Order.aggregate([
      {
        $match: { orderStatus: { $eq: "Delivered" } },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" } },
          totalPrice: { $sum: "$total" },
          products: { $sum: { $size: "$products" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    // const filterOrder = await Order.find({})
    res.render("admin/yearReport", { salesReport });
  } catch (error) {
    res.render("admin/error");
  }
};

// pie chart details

const pieChart = async (req, res) => {
  try{
  const cancel = await Order.find({ orderStatus: "Cancelled" }).count();
  const Delivered = await Order.find({ orderStatus: "Delivered" }).count();
  const returned = await Order.find({ orderStatus: "Returnd" }).count();
  let data = [];
  data.push(cancel);
  data.push(Delivered);
  data.push(returned);

  res.json({ data });
} catch (error) {
  res.render("admin/error");
}
};


// bar chart details
const GetChartDetails = async (req, res) => {
 try{
    const value = req.query.value;
    var date = new Date();
    var month = date.getMonth();
    var year = date.getFullYear();
    let sales = [];
    if (value == 365) {
      year = date.getFullYear();
      var currentYear = new Date(year, 0, 1);
      let salesByYear = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: currentYear },
            orderStatus: { $eq: "Delivered" },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%m", date: "$createdAt" } },
            totalPrice: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      for (let i = 1; i <= 12; i++) {
        let result = true;
        for (let k = 0; k < salesByYear.length; k++) {
          result = false;
          if (salesByYear[k]._id == i) {
            sales.push(salesByYear[k]);
            break;
          } else {
            result = true;
          }
        }
        if (result) sales.push({ _id: i, totalPrice: 0, count: 0 });
      }
      var lastYear = new Date(year - 1, 0, 1);
       let salesData=[]
      for (let i = 0; i < sales.length; i++) {
        salesData.push(sales[i].totalPrice);
      }
      res.json({ status: true, sales:salesData})
    } else if (value == 30) {


      console.log("month");
      let firstDay = new Date(year, month, 1);
      firstDay = new Date(firstDay.getTime() + 1 * 24 * 60 * 60 * 1000);
      let nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);
     
      for (let i = 1; i <= 5; i++) {
        let abc = {};
        let salesByMonth = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: firstDay, $lt: nextWeek },
              orderStatus: { $eq: "Delivered" },
            },
          },
          {
            $group: {
              _id: moment(firstDay).format("DD-MM-YYYY"),
              totalPrice: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ]);
        if (salesByMonth.length) {
          sales.push(salesByMonth[0]);
        } else {
          (abc._id = moment(firstDay).format("DD-MM-YYYY")),
            (abc.totalPrice = 0);
          abc.count = 0;
          sales.push(abc);
        }
  
        firstDay = nextWeek;
        if (i == 4) {
          nextWeek = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth() + 1,
            1
          );
        } else {
          nextWeek = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth() + 0,
            (i + 1) * 7
          );
        }
      }
   
        let salesData=[]
      for (let i = 0; i < sales.length; i++) {
        salesData.push(sales[i].totalPrice);  
      }
      res.json({ status: true, sales:salesData})
    } else if (value == 7) {

      let today = new Date();
      let lastDay = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
      for (let i = 1; i <= 7; i++) {
        let abc = {};
        let salesByWeek = await Order.aggregate([
          {
            $match: {
              createdAt: { $lt: today, $gte: lastDay },
              orderStatus: { $eq: "Delivered" },
            },
          },
          {
            $group: {
              _id:  moment(today).format("DD-MM-YYYY"),
              totalPrice: { $sum: "$total" },
              count: { $sum: 1 },
            },
          },
        ]);
        if (salesByWeek.length) {
          sales.push(salesByWeek[0]);
        } else {
          abc._id = today.getDay() + 1;
          abc.totalPrice = 0;
          abc.count = 0;
          sales.push(abc);
        }

        
        today = lastDay;
        lastDay = new Date(
          new Date().getTime() - (i + 1) * 24 * 60 * 60 * 1000
        );
      }
     
     let salesData=[]
      for (let i = 0; i < sales.length; i++) {
        salesData.push(sales[i].totalPrice);
        
      }
  

      res.json({ status: true,sales: salesData})
    }
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
  getEditCategory,
  postEditCategory,
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
};
