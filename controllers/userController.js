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
const { sendSms, verifySms } = require("../verification/otp");
const { findById, populate } = require("../models/product");
const Razorpay = require("razorpay");
var {
  validatePaymentVerification,
} = require("../node_modules/razorpay/dist/utils/razorpay-utils");
const { default: mongoose } = require("mongoose");
const cart = require("../models/cart");

var instance = new Razorpay({
  key_secret: "DvG40o8cF8F6bHGUkMHyeMPE",
  key_id: "rzp_test_VZx01l8lO0abIf",
});
// home
const homeView = async (req, res) => {
  try {
    let product = await Product.find();
    let banner = await Banner.find({ delete: { $ne: true } });

    // let cart =await Cart.find({owner:req.session.user._id})
    // console.log(cart);

    // let count=cart.items.length
    // console.log(count);
    res.render("user/home", { product, user: req.session.user, banner });
  } catch (error) {
    res.render("admin/error");
  }
};
// Ṃen page
const menView = async (req, res) => {
  try {
    const product = await Product.find({ category: "Mens" });
    const category = await Category.find({ category: "Mens" });

    res.render("user/men", { product, category, user: req.session.user });
  } catch (error) {
    res.render("admin/error");
  }
};

// women page
const womenView = async (req, res) => {
  try {
    const product = await Product.find({ category: "Women" });
    const category = await Category.find({ category: "Women" });

    res.render("user/women", { product, category, user: req.session.user });
  } catch (error) {
    res.render("admin/error");
  }
};
// aboute page
const aboutView = (req, res) => {
  try {
    let user = req.session.user;
    res.render("user/about", {
      Product: Product,
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

    res.render("user/contact", { user: user });
  } catch (error) {
    res.render("admin/error");
  }
};

//get cart page

const cartView = async (req, res) => {
  try {
    let ownerId = req.session.user._id;

    const cartItems = await Cart.findOne({ owner: ownerId })
      .populate("items.product")
      .exec((err, allCart) => {
        if (err) {
          return console.log(err);
        } else {
          if (allCart) {
            res.render("user/cart", {
              allCart,
              user: req.session.user,
              notAvailable: req.flash("notAvailable"),
            });
          } else {
            res.render("user/cartEmpty", {
              user: req.session.user,
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
    console.log(product.stock);
    if (product.stock < 1) {
      console.log("no stockkkkkkkkkkkkk");
      res.json({ noAvailability: true });
    } else {
      console.log("stockkkkkkkkkkkkk he");

      const cartTotal = product.price;
      if (!user) {
        const addToCart = await Cart({
          owner: req.session.user._id,
          items: [{ product: productId, totalPrice: product.price }],
          cartTotal: cartTotal,
        });
        addToCart.save().then(() => {
          res.redirect("/productDetails/" + productId);
        });
      } else {
        console.log("add cheytho");
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
          console.log(proQuantity);
          const quantity = proQuantity[0].items[0].quantity;
          console.log(quantity);

          console.log(product.stock);

          if (product.stock <= quantity) {
            console.log(" all ready stock kayin ");
            res.json({ stockReached: true });
          } else {
            await Cart.findOneAndUpdate(
              { owner: req.session.user._id, "items.product": productId },
              {
                $inc: {
                  "items.$.quantity": 1,
                  "items.$.totalPrice": product.price,
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
                items: { product: productId, totalPrice: product.price },
              },
              $inc: { cartTotal: cartTotal, subTotal: product.price },
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
    console.log("delete starting");
    const userId = req.session.user;
    const productId = req.query.productId;
    const product = await Product.findOne({ _id: productId });

    const cartTotal = product.price;
    const deleteProduct = await Cart.findOneAndUpdate(
      { owner: userId },
      {
        $pull: {
          items: { product: productId },
        },
        $inc: { cartTotal: -cartTotal },
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
    if (count == 1) {
      var productPrice = product.price;
    } else {
      var productPrice = -product.price;
    }
    console.log("heeeeeeee");
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
    console.log(proQuantity);
    const quantity = proQuantity[0].items[0].quantity;
    console.log(quantity);

    console.log(product.stock);
    if (product.stock <= quantity && count == 1) {
      console.log("stock reached");
      res.json({ stockReached: true });
    } else {
      console.log("not reached");
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
    if (email && password) {
      let user = await User.findOne({ email: email });

      if (user) {
        let matched = await bcrypt.compare(password, user.password);
        if (matched) {
          if (user.access === true) {
            req.session.loggedIn = true;
            req.session.user = user;
            res.redirect("/");
            console.log("login succeded");
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

// logout user
const logoutUser = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    res.render("admin/error");
  }
};

// products details page
const productDetails = (req, res) => {
  try {
    const proId = req.params.id;

    Product.findById(proId).then((product) => {
      res.render("user/product_details", {
        product,
        proId,
        user: req.session.user,
      });
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
    console.log(phone);
    sendSms(phone);
    res.redirect("/otp");
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
      console.log("prodcut not stock");

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
    console.log(req.body.paymentMethod);
    if (req.body.address) {
      let user = req.session.user;
      let userId = user._id;
      let address = await Address.findOne({ user: userId });
      console.log(req.body.total, "total body");
      const deliveryAddress = address.address.find(
        (el) => el._id.toString() === req.body.address
      );
      let cart = await Cart.findById(req.body.cartId);
      let proId = cart.items.product;
      if (req.body.paymentMethod === "cash on delivery") {
        const paymentMethod = req.body.paymentMethod;
        const newOrder = new Order({
          date: new Date(),
          time: new Date().toLocaleTimeString(),
          userId: userId,
          products: cart.items,
          total: req.body.total,
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
          total: req.body.total,
          address: deliveryAddress,
          paymentMethod: paymentMethod,
          paymentStatus: "Payment Completed",
          orderStatus: "orderconfirmed",
          track: "Shipped",
        });
        newOrder.save().then((result) => {
          let userOrderData = result;

          id = result._id.toString();
          instance.orders.create(
            {
              amount: result.total * 100,
              currency: "INR",
              receipt: id,
            },
            (err, order) => {
              console.log(err, "errrrrrrrrrrrrrrr");
              console.log(order, "orderrrrrrrrrrrrrrrrrrr");
              let response = {
                Razorpay: true,
                razorpayOrderData: order,
                userOrderData: userOrderData,
              };

              res.json(response);
            }
          );
        });
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
      let order = await Order.findById(userOrderDataId);
      orderStatus = "Order Placed";
      paymentStatus = "Payment Completed";
      order.save().then((result) => {
        res.json({ status: true });
      });
      findProductId.forEach(async (el) => {
        let removeQuantity = await Product.findOneAndUpdate(
          { _id: el.product },
          { $inc: { stock: -el.quantity } }
        );
      });
      await Cart.findOneAndRemove({ userId: req.session.user._id }).then(
        (result) => {
          console.log("cart removed");
        }
      );
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
    // console.log(orders,"my orders");
    res.render("user/myOrder", { user: req.session.user, orders });
  } catch (error) {
    res.render("admin/error");
  }
};

const getOrderDetails = async (req, res) => {
  try {
    console.log(req.query.id);
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
  let orderId = req.query.id;

  let order = await Order.findByIdAndUpdate(orderId, {
    orderStatus: "Cancelled",
    track: "Cancelled",
  }).then((result) => {
    console.log(result);
    const findProductId = result.products;
    findProductId.forEach(async (el) => {
      let removeQuantity = await Product.findOneAndUpdate(
        { _id: el.product },
        { $inc: { stock: el.quantity } }
      );
    });
  });
};

// order returned
const returnOrder = async (req, res) => {
  orderId = mongoose.Types.ObjectId(req.body.oid.trim());
  value = req.body.value;

  console.log(orderId, value, "return order");

  await Order.findByIdAndUpdate(orderId, {
    track: "Returnd",
    orderStatus: "Returnd",
    returnreason: value,
  }).then((response) => {
    res.json({ status: true });
  });
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
      const address = await Address.findOne({ user: req.session.user });

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
  console.log(req.body.CouponCode, "coupen cod");
  console.log(req.body.total);
  let couponcode = req.body.CouponCode;
  let total = req.body.total;
  let grandtotal;
  let couponMsg;

  let coupon = await Coupon.find({
    code: couponcode,
    status: "ACTIVE",
  });
  console.log(coupon);
  if (coupon.length == 0) {
    couponMsg = "Coupon Invalid";
    res.json({ status: false, couponMsg });
  } else {
    let couponType = coupon[0].couponType;
    let cutOff = parseInt(coupon[0].cutOff);
    let maxRedeemAmount = parseInt(coupon[0].maxRedeemAmount);
    let minCartAmount = parseInt(coupon[0].minCartAmount);
    let generateCount = parseInt(coupon[0].generateCount);
    if (generateCount != 0) {
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
    } else {
      couponMsg = "Coupon limit Exceeded";
      res.json({ status: false, couponMsg });
    }
  }
};

// requist to refund

const requistRefund = async (req, res) => {
  orderId = req.query.orderId;
  console.log(orderId, "refund");

  const order = await Order.findOne({ _id: orderId }).populate("userId");
  console.log(order.userId.wallet);
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
};
