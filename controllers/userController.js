  const bcrypt = require("bcrypt");
const Product = require("../models/product");
const user = require("../models/user");
const User = require("../models/user");
const Cart = require("../models/cart");
const Address = require("../models/address");
const Order = require("../models/order");
const Banner = require("../models/banner");
const Category = require("../models/category");
const Coupon = require("../models/coupon");
const Review = require("../models/reviews");

const {menPagination,womenPagination }=require('../middlewares/pagination')

const { sendSms, verifySms } = require("../verification/otp");
const { findById, populate } = require("../models/product");
const Razorpay = require("razorpay");
var {
  validatePaymentVerification,
} = require("../node_modules/razorpay/dist/utils/razorpay-utils");
const { default: mongoose } = require("mongoose");
const cart = require("../models/cart");
const moment = require("moment");


var instance = new Razorpay({
  key_secret: "DvG40o8cF8F6bHGUkMHyeMPE",
  key_id: "rzp_test_VZx01l8lO0abIf",
});


// get login
const loginView = (req, res) => {
  try {
    res.render("user/login", {
      emailErr: req.flash("emailErr"),
      passErr: req.flash("passErr"),
      fillErr: req.flash("fillErr"),
      blocked: req.flash("blocked"),
    });
  } catch (error) {
    res.render("admin/error");
  }
};

//post login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    if (email && password) {
      let user = await User.findOne({ email: email });
    console.log(user);
      if (user) {
        let matched = await bcrypt.compare(password, user.password);
        if (matched) {
          console.log(matched);
          if (user.access === true) {
            console.log(user.access);
            req.session.loggedIn = true;
            req.session.user = user;
            res.redirect("/");
          } else {
            req.flash("blocked", "you are blocked");
            res.redirect("/login");
          }
        } else {
          req.flash("passErr", "password not match");
          res.redirect("/login");
        }
      } else {
        req.flash("emailErr", "Email  not match");
        res.redirect("/login");
      }
    } else {
      req.flash("fillErr", "fill the colom");
      res.redirect("/login");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// register page
const registerView = (req, res) => {
  try {
    res.render("user/register", {
      registerErr: req.flash("registerErr"),
      existErr: req.flash("existErr"),
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// register post
const registerUser = async (req, res) => {
  try {
    const { name, number, email, password } = req.body;
    if (name && number && email && password) {
      User.findOne({ email: email }).then(async (user) => {
        if (!user) {
          req.session.user = req.body;
          sendSms(number);
          res.redirect("/otp");
        } else {
          req.flash("existErr", "Email allready exist");
          return res.redirect("/register");
        }
      });
    } else {
      req.flash("registerErr", "Fill the coloms");
      res.redirect("/register");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// post otp
const postOtp = async (req, res) => {
  try {
    const { name, number, email, password } = req.session.user;
    const otp = req.body.otp;
    const phone = number;
    await verifySms(phone, otp).then(async (verification_check) => {
      if (verification_check.status == "approved") {
        const hashPassword = await bcrypt.hash(password, 10);
        newUser = User({
          name: name,
          number: number,
          email: email,
          password: hashPassword,
        });
        newUser.save();
        res.redirect("/login");
      } else {
        req.flash("otpErr", "otp not match");
        res.redirect("/otp");
      }
    });
  } catch (error) {
    res.render("admin/error");
  }
};



// otp section
const getOtp = (req, res) => {
  try {
    res.render("user/otp", { otpErr: req.flash("otpErr") });
  } catch (error) {
    res.render("admin/error");
  }
};

// resend otp
const resendOtp = (req, res) => {
  try {
    const { number } = req.session.user;
    const phone = number;
    sendSms(phone);
    res.redirect("/otp");
  } catch (error) {
    res.render("admin/error");
  }
};

// home
const homeView = async (req, res) => {
  try {

   
    let product = await Product.find().limit(8)
    let banner = await Banner.find({ delete: { $ne: true } });
    res.render("user/home", {
      product,
      user: req.session.user,
      banner,
      homView: true,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// Ṃen page
const menView = async (req, res) => {
  try {
    const product = res.menPagination
    const category = await Category.find({ category: "Mens" });

    res.render("user/men", { product, category, user: req.session.user });
  } catch (error) {
    res.render("admin/error");
  }
};

// women page
const womenView = async (req, res) => {
  try {
    const product = res.womenPagination
    const category = await Category.find({ category: "Women" });
    res.render("user/women", { product, category, user: req.session.user });
  } catch (error) {
    res.render("admin/error");
  }
};


// products details page
const productDetails = async (req, res) => {
  try {
    const proId = req.params.id;
    let product = await Product.findById(proId);

    let review = await Review.find({ product: proId }).populate("user");
    res.render("user/product_details", {
      product,
      review,
      proId,
      user: req.session.user,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// aboute page
const aboutView = (req, res) => {
  try {
    let user = req.session.user;
    res.render("user/about", {
      aboutView: true,
      user: user,
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// contact page
const contactView = (req, res) => {
  try {
    let user = req.session.user;
    res.render("user/contact", { user: user, contactView: true });
  } catch (error) {
    res.render("admin/error");
  }
};

//get cart page

const cartView = async (req, res) => {
  try {
    let ownerId = req.session.user._id;

     await Cart.findOne({ owner: ownerId })
      .populate("items.product")
      .exec((err, allCart) => {
        if (err) {
          return console.log(err);
        } else {
          if (allCart) {
            res.render("user/cart", {
              allCart,
              user: req.session.user,
              cartView: true,
              notAvailable: req.flash("notAvailable"),
            });
          } else {
            res.render("user/cartEmpty", {
              user: req.session.user,
              cartView: true,
            });
          }
        }
      });
  } catch (error) {
    res.render("admin/error");
  }
};

// post cart

const addToCart = async (req, res) => {
  try {
    const productId = req.params.id;
    let ownerId = req.session.user._id;
    const user = await Cart.findOne({ owner: req.session.user._id });
    const product = await Product.findOne({ _id: productId });
    let price;
     if(product.discountPrice<product.price&&product.discountPrice!=0){
         price=product.discountPrice
     }else{
      price=product.price
     }
    if (product.stock < 1) {
      res.json({ noAvailability: true });
    } else {
      const cartTotal = price;
      if (!user) {
        const addToCart = await Cart({
          owner: req.session.user._id,
          items: [{ product: productId, totalPrice:price }],
          cartTotal: cartTotal,
        });
        addToCart.save().then(() => {
          res.redirect("/productDetails/" + productId);
        });
      } else {
        const existProduct = await Cart.findOne({
          owner: req.session.user._id,
          "items.product": productId,
        });
        if (existProduct != null) {
          const proQuantity = await Cart.aggregate([
            {
              $match: { owner: mongoose.Types.ObjectId(req.session.user._id) },
            },
            {
              $project: {
                items: {
                  $filter: {
                    input: "$items",
                    cond: {
                      $eq: [
                        "$$this.product",
                        mongoose.Types.ObjectId(productId),
                      ],
                    },
                  },
                },
              },
            },
          ]);
          const quantity = proQuantity[0].items[0].quantity;
          if (product.stock <= quantity) {
            res.json({ stockReached: true });
          } else {
            await Cart.findOneAndUpdate(
              { owner: req.session.user._id, "items.product": productId },
              {
                $inc: {
                  "items.$.quantity": 1,
                  "items.$.totalPrice": price,
                  cartTotal: cartTotal,
                  subTotal: cartTotal,
                },
              }
            ).then(() => {
              res.redirect("/productDetails/" + productId);
            });
          }
        } else {
          const addToCart = await Cart.findOneAndUpdate(
            { owner: req.session.user._id },
            {
              $push: {
                items: { product: productId, totalPrice: price },
              },
              $inc: { cartTotal: cartTotal, subTotal:price },
            }
          );
          addToCart.save().then(() => {
            res.redirect("/productDetails/" + productId);
          });
        }
      }
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// delete cart product

const deleteCartProduct = async (req, res) => {
  try {
    const userId = req.session.user;
    const productId = req.query.productId;
    const cart = await Cart.findOne({ owner: userId });
    const index = await cart.items.findIndex((el) => {
      return el.product == productId;
    });
    const price = cart.items[index].totalPrice;

    const deleteProduct = await Cart.findOneAndUpdate(
      { owner: userId },
      {
        $pull: {
          items: { product: productId },
        },
        $inc: { cartTotal: -price },
      }
    );
    deleteProduct.save().then(() => {
      res.json("success");
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// cart product  quantity change
const cartChangeQuantity = async (req, res) => {
  try {
    const { cartId, productId, count } = req.query;
    const product = await Product.findOne({ _id: productId });
    
    let price;
    if(product.discountPrice<product.price&&product.discountPrice!=0){
        price=product.discountPrice
    }else{
     price=product.price
    }

    if (count == 1) {
      var productPrice = price;
    } else {
      var productPrice = -price;
    }

    
    const proQuantity = await Cart.aggregate([
      { $match: { owner: mongoose.Types.ObjectId(req.session.user._id) } },
      {
        $project: {
          items: {
            $filter: {
              input: "$items",
              cond: {
                $eq: ["$$this.product", mongoose.Types.ObjectId(productId)],
              },
            },
          },
        },
      },
    ]);
    const quantity = proQuantity[0].items[0].quantity;
    if (product.stock <= quantity && count == 1) {
      res.json({ stockReached: true });
    } else {
      const cart = await Cart.findOneAndUpdate(
        { _id: cartId, "items.product": productId },
        {
          $inc: {
            "items.$.quantity": count,
            "items.$.totalPrice": productPrice,
            cartTotal: productPrice,
          },
        }
      ).then(() => {
        res.json();
      });
    }
  } catch (error) {
    res.render("admin/error");
  }
};


// checkout page
const getCheckout = async (req, res) => {
  try {
    let index = Number(req.body.index);
    if (!index) {
      index = 0;
    }
    const userId = req.session.user._id;
    const addresses = await Address.findOne({ user: userId });
    let address;
    if (addresses) {
      address = addresses.address;
    } else {
      address = [];
    }

    const cartItems = await Cart.findOne({ owner: userId }).populate(
      "items.product"
    );
    let check = false;
    let products = [];
    for (let i = 0; i < cartItems.items.length; i++) {
      if (cartItems.items[i].quantity > cartItems.items[i].product.stock) {
        check = true;
        products.push(cartItems.items[i].product.name);
      }
    }

    if (check == true) {
      req.flash("notAvailable", products + " Not available in stock");
      res.redirect("/cart");
    } else {
      if (cartItems) {
        res.render("user/checkout", {
          user: req.session.user,
          address,
          index,
          cartItems,
        });
      } else {
        res.redirect("/cart");
      }
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// post checkout

const postCheckout = async (req, res) => {
  try {
    if (req.body.address) {
      let user = req.session.user;
      let userId = user._id;
      let subTotal=req.body.subtotal
      let total = req.body.total;
   
      let coupon = await Coupon.findOne({ code: req.body.couponCod });
      
      if(coupon){
       var  couponDis= subTotal-total
      }
      const paymentMethod = req.body.paymentMethod;
      let address = await Address.findOne({ user: userId });
      const deliveryAddress = address.address.find(
        (el) => el._id.toString() === req.body.address
      );
      let cart = await Cart.findById(req.body.cartId);
      let proId = cart.items.product;
      if (req.body.paymentMethod === "cash on delivery") {
        const newOrder = new Order({
          date: new Date(),
          time: new Date().toLocaleTimeString(),
          userId: userId,
          products: cart.items,
          couponDiscount:couponDis,
          total: total,
          address: deliveryAddress,
          paymentMethod: paymentMethod,
          paymentStatus: "Payment Pending",
          orderStatus: "orderconfirmed",
          track: "orderconfirmed",
        });
        newOrder.save().then(async (result) => {
          req.session.orderId = result._id;
          let order = await Order.findOne({ _id: result._id });
          const findProductId = order.products;
          findProductId.forEach(async (el) => {
            let removeQuantity = await Product.findOneAndUpdate(
              { _id: el.product },
              { $inc: { stock: -el.quantity } }
            );
          });
          if (coupon) {
            let cartCount = await Coupon.findOneAndUpdate(
              { _id: coupon._id },
              { $inc: { generateCount: -1 } }
            );
          }

          await Cart.findOneAndRemove({ userId: result.userId }).then(
            (result) => {
              res.json({ cashOnDelivery: true });
            }
          );
        });
      } else if (req.body.paymentMethod === "Razorpay") {
        const paymentMethod = req.body.paymentMethod;

        const newOrder = new Order({
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          userId: userId,
          products: cart.items,
          total: total,
          address: deliveryAddress,
          couponDiscount:couponDis,
          paymentMethod: paymentMethod,
          paymentStatus: "Payment Pending",
          orderStatus: "orderconfirmed",
          track: "orderconfirmed",
        });
        newOrder.save().then((result) => {
          let userOrderData = result;
          req.session.orderId = result._id;
          id = result._id.toString();
          instance.orders.create(
            {
              amount: result.total * 100,
              currency: "INR",
              receipt: id,
            },
            (err, order) => {
              console.log(err, "errorrrrrrrrr");
              console.log(order, "orderrrr");
              let response = {
                Razorpay: true,
                razorpayOrderData: order,
                userOrderData: userOrderData,
              };

              res.json(response);
            }
          );
        });
      } else if (req.body.paymentMethod === "Wallet") {
        user = await User.findOne({ _id: req.session.user._id });
        const walletBalance = user.wallet;
        if (walletBalance == 0) {
          res.json({ noBalance: true });
        } else {
          if (walletBalance < total) {
            const balancePayment = total - walletBalance;  
          const newOrder = new Order({
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
              userId: userId,
              products: cart.items,
              total: total,
              couponDiscount:couponDis,
              address: deliveryAddress,
              paymentMethod: "Wallet",
              paymentStatus: "Payment Pending",
              orderStatus: "orderconfirmed",
              track: "orderconfirmed",
            });
            newOrder.save().then((result) => {
              let userOrderData = result;
              req.session.orderId = result._id;
              id = result._id.toString();
              instance.orders.create(
                {
                  amount: balancePayment * 100,
                  currency: "INR",
                  receipt: id,
                },
                (err, order) => {
                  console.log(err, "errorrrrrrrrr");
                  let response = {
                    Razorpay: true,
                    walletBalance: walletBalance,
                    razorpayOrderData: order,
                    userOrderData: userOrderData,
                  };

                  res.json(response);
                }
              );
            });
          } else {
            const newOrder = new Order({
              date: new Date(),
              time: new Date().toLocaleTimeString(),
              userId: userId,
              products: cart.items,
              total: total,
              couponDiscount:couponDis,
              address: deliveryAddress,
              paymentMethod: "Wallet",
              paymentStatus: "Payment completed",
              orderStatus: "orderconfirmed",
              track: "orderconfirmed",
            });
            newOrder.save().then(async (result) => {
              req.session.orderId = result._id;
           
              // quantity check
              let order = await Order.findOne({ _id: result._id });
              const findProductId = order.products;
              findProductId.forEach(async (el) => {
                let removeQuantity = await Product.findOneAndUpdate(
                  { _id: el.product },
                  { $inc: { stock: -el.quantity } }
                );
              });
                  
                //  wallet check
              let orderWallet=await Order.findByIdAndUpdate({_id:result._id },
                {$set:{
                useWallet:total
              }});
              let walletAmount = await User.findOneAndUpdate(
                { _id: userId },
                { $inc: { wallet: -total } }
              );
              // coupon check
              if (coupon) {
                let cartCount = await Coupon.findOneAndUpdate(
                  { _id: coupon._id },
                  { $inc: { generateCount: -1 } }
                );
              }
                       

              // remove chart
              await Cart.findOneAndRemove({ userId: result.userId }).then(
                (result) => {
                  res.json({ wallet: true });
                }
              );
            });
          }
        }
      } else {
        res.json({ choosePay: true });
      }
    } else {
      res.json({ chooseAddress: true });
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// verify payment
const verifyPayment = async (req, res) => {
  try {
    let razorpayOrderDataId = req.body["payment[razorpay_order_id]"];

    let paymentId = req.body["payment[razorpay_payment_id]"];

    let paymentSignature = req.body["payment[razorpay_signature]"];

    let userOrderDataId = req.body["userOrderData[_id]"];

    validate = validatePaymentVerification(
      { order_id: razorpayOrderDataId, payment_id: paymentId },
      paymentSignature,
      "DvG40o8cF8F6bHGUkMHyeMPE"
    );

    if (validate) {
      await Order.findByIdAndUpdate(userOrderDataId, {
      orderStatus : "Order Placed",
        paymentStatus: "Payment Completed",
      }).then(async (result) => {
  
    // wallet balancd
        if (result.paymentMethod == "Wallet") {
           
          let order=await Order.findByIdAndUpdate({_id:userOrderDataId},
            {$set:{
            useWallet:req.body.walletBalance
          }});
          let walletAmount = await User.findOneAndUpdate(
            { _id: req.session.user._id },
            { $inc: { wallet: -req.body.walletBalance} }
          );
        }
        // quantity check
        const findProductId = result.products;
        findProductId.forEach(async (el) => {
          let removeQuantity = await Product.findOneAndUpdate(
            { _id: el.product },
            { $inc: { stock: -el.quantity } }
          );
        });


        // coupon check
        console.log( req.body.CouponCode);
        let coupon = await Coupon.findOne({ code: req.body.CouponCode });
        if (coupon) {
          let cartCount = await Coupon.findOneAndUpdate(
            { _id: coupon._id },
            { $inc: { generateCount: -1 } }
          );
        }
        // cart remove
        await Cart.findOneAndRemove({ userId: req.session.user._id }).then(
          () => {
            res.json({ status: true });
          }
        );
      });
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// payment   failed
const paymentFailed = (req, res) => {
  try {
    res.json({ status: true });
  } catch (error) {
    res.render("admin/error");
  }
};

// order complete

const getOrderComplete = async (req, res) => {
  try {
    res.render("user/order_confirm", { user: req.session.user });
  } catch (error) {
    res.render("admin/error");
  }
};

// my order page

const getMyOrder = async (req, res) => {
  try {
    let orders = await Order.find({ userId: req.session.user }).sort({
      updatedAt: -1,
    });
    res.render("user/myOrder", { user: req.session.user, orders });
  } catch (error) {
    res.render("admin/error");
  }
};

// get order details
const getOrderDetails = async (req, res) => {
  try {
    let orderDetails = await Order.findOne({ _id: req.query.id }).populate(
      "products.product"
    );
    res.render("user/orderDetails", { user: req.session.user, orderDetails });
  } catch (error) {
    res.render("admin/error");
  }
};

// order cancelle
const cancelOrder = async (req, res) => {
  try{
  let orderId = req.query.id;

  let order = await Order.findByIdAndUpdate(orderId, {
    orderStatus: "Cancelled",
    track: "Cancelled",
  }).then((result) => {
    const findProductId = result.products;
    findProductId.forEach(async (el) => {
      let removeQuantity = await Product.findOneAndUpdate(
        { _id: el.product },
        { $inc: { stock: el.quantity } }
      );
    });
  });
} catch (error) {
  res.render("admin/error");
}
};

// order returned
const returnOrder = async (req, res) => {
  try{
  orderId = mongoose.Types.ObjectId(req.body.oid.trim());
  value = req.body.value;

  await Order.findByIdAndUpdate(orderId, {
    track: "Returnd",
    orderStatus: "Returnd",
    returnreason: value,
  }).then((response) => {
    res.json({ status: true });
  });
} catch (error) {
  res.render("admin/error");
}
};

// user profile page
const getProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addresses = await Address.findOne({ user: userId }).populate("user");
    let address;
    if (addresses) {
      address = addresses.address;
    } else {
      address = [];
    }
    res.render("user/profile", { address, addresses, user: req.session.user });
  } catch (error) {
    res.render("admin/error");
  }
};

// add address button
const getAddress = (req, res) => {
  try {
    res.render("user/address", {
      user: req.session.user,
      addressErr: req.flash("addressErr"),
    });
  } catch (error) {
    res.render("admin/error");
  }
};

const postAdress = async (req, res) => {
  try {
    const { country, fName, state, addressLine, city, pincode } = req.body;
    if (country && fName && state && addressLine && city && pincode) {
      var userId = req.session.user._id;
      const existAddress = await Address.findOne({ user: userId });
      if (existAddress) {
        await Address.findOneAndUpdate(
          { user: userId },
          {
            $push: {
              address: [req.body],
            },
          }
        ).then(() => {
          res.redirect("/profile");
        });
      } else {
        const addAddress = await Address({
          user: userId,
          address: [req.body],
        });
        addAddress.save().then(() => {
          res.redirect("/profile");
        });
      }
    } else {
      req.flash("addressErr", "fill full coloms");
      res.redirect("/address");
    }
  } catch (error) {
    res.render("admin/error");
  }
};
const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const id = req.query.address;
    await Address.updateOne(
      { user: userId },
      { $pull: { address: { _id: id } } }
    );
    res.json("success");
  } catch (error) {
    res.render("admin/error");
  }
};

const getEditAddress = async (req, res) => {
  try {
    let addressDB = await Address.findOne({ user: req.session.user });
    const address = addressDB.address.find(
      (el) => el._id.toString() === req.params.id
    );

    res.render("user/edit_address", {
      user: req.session.user,
      address,
      editAddressErr: req.flash("editAddressErr"),
    });
  } catch (error) {
    res.render("admin/error");
  }
};

const postEditAddress = async (req, res) => {
  try {
    const { country, fName, state, addressLine, city, pincode } = req.body;
    if (country && fName && state && addressLine && city && pincode) {
      const addressId = req.params.id;
      const updateAddress = await Address.updateMany(
        {
          "address._id": addressId,
        },
        {
          $set: {
            "address.$.fName": fName,
            "address.$.pinCode": pincode,
            "address.$.addressLine": addressLine,
            "address.$.city": city,
            "address.$.state": state,
            "address.$.country": country,
          },
          new: true,
        },
        { upsert: true }
      );
      res.redirect("/profile");
    } else {
      req.flash("editAddressErr", "fill full coloms");
      res.redirect("/editAddress/" + req.params.id);
    }
  } catch (error) {
    res.render("admin/error");
  }
};

const verifyCoupon = async (req, res) => {
  try {
    let couponcode = req.body.CouponCode;
    let total = req.body.total;
    let grandtotal;
    let couponMsg;
    let nowDate= moment().format("DD/MM/YYYY");
    let coupon = await Coupon.find({
      code: couponcode,
      status: "ACTIVE",
    });

    if (coupon.length == 0) {
      couponMsg = "Coupon Invalid";
      res.json({ status: false, couponMsg });
    } else {
      let expireDate= coupon[0].expireDate.toLocaleDateString()
      let couponType = coupon[0].couponType;
      let cutOff = parseInt(coupon[0].cutOff);
      let maxRedeemAmount = parseInt(coupon[0].maxRedeemAmount);
      let minCartAmount = parseInt(coupon[0].minCartAmount);
      let generateCount = parseInt(coupon[0].generateCount);
      if (generateCount != 0) {
        if(nowDate>expireDate){
        if (couponType == "Amount") {
          if (total < minCartAmount) {
            couponMsg =
              "Minimum Rs." + minCartAmount + " need to Apply this Coupon";
            res.json({ status: false, couponMsg });
          } else {
            grandtotal = Math.round(total - cutOff);
            let response = {
              status: true,
              grandtotal: grandtotal,
              couponMsg,
              CutOff: cutOff,
            };
            res.json(response);
          }
        } else if ((couponType = "Percentage")) {
          if (total < minCartAmount) {

            couponMsg =
              "Minimum Rs." + minCartAmount + " need to Apply this Coupon";
            res.json({ status: false, couponMsg });
          } else {
            let reduceAmount = Math.round((total * cutOff) / 100);
            if (reduceAmount > maxRedeemAmount) {
              grandtotal = Math.round(total - maxRedeemAmount);
              let response = {
                status: true,
                grandtotal: grandtotal,
                couponMsg,
                CutOff: maxRedeemAmount,
              };
              res.json(response);
            } else {
              grandtotal = Math.round(total - reduceAmount);
              let response = {
                status: true,
                grandtotal: grandtotal,
                couponMsg,
                CutOff: reduceAmount,
              };
              res.json(response);
            }
          }
        }
      }else{
        couponMsg = "Coupon date expired";
        res.json({ status: false, couponMsg });
      }
      } else {
        couponMsg = "Coupon limit Exceeded";
        res.json({ status: false, couponMsg });
      }
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// requist to refund

const requistRefund = async (req, res) => {
  try {
    orderId = req.query.orderId;
    const order = await Order.findOne({ _id: orderId }).populate("userId");
    if (order.userId.wallet === 0) {
      await User.updateOne(
        { _id: order.userId },
        { $set: { wallet: order.total }, new: true },
        { upsert: true }
      );
    } else {
      await User.findOneAndUpdate(
        { _id: order.userId },
        {
          $inc: {
            wallet: order.total,
          },
        }
      );
    }
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "Refunded",
    }).then((response) => {
      res.json({ status: true });
    });
  } catch (error) {
    res.render("admin/error");
  }
};

// post review

const postReview = async (req, res) => {
  try {
    let { rating, review, product, title } = req.body;
    rating = rating * 20;
    Object.assign(req.body, { user: req.session.user._id ,rating:rating});

    Review.findOneAndReplace({product:product,user:req.session.user._id},req.body).then(async result=>{
      if(result){
        let rat = {} = await Product.findById(product, { _id: 0, rating: 1 ,review:1});
        rating=(rat.rating+rating - result.rating)/rat.review
          await Product.findByIdAndUpdate(product,{$set:{rating:rating}})
          res.json();

      }else{
        const newReview = await new Review(req.body);
        await newReview.save().then(async () => {
          await Product.findByIdAndUpdate(product, {
            $inc: { review: 1 },
            $set: { rating: rating },
          });
          res.json();
        });

      }
    })

  
  } catch (error) {
    res.render("admin/error");
  }
};

// logout user
const logoutUser = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    res.render("admin/error");
  }
};

module.exports = {
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
  resendOtp,
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
  postReview,
};
