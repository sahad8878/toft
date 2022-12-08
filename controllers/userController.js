const bcrypt = require("bcrypt");
const Product = require("../models/product");
const user = require("../models/user");
const User = require("../models/user");
const Cart = require("../models/cart");
const Address = require("../models/address");
const Order = require("../models/order");
const Banner = require("../models/banner");
const { sendSms, verifySms } = require("../verification/otp");
const { findById, populate } = require("../models/product");
const Razorpay = require('razorpay');
var {
  validatePaymentVerification,
} = require('../node_modules/razorpay/dist/utils/razorpay-utils');


var instance = new Razorpay({
  key_secret: 'DvG40o8cF8F6bHGUkMHyeMPE',
  key_id: 'rzp_test_VZx01l8lO0abIf',
});
// home
const homeView =async (req, res) => {
  try {

    let product=await Product.find()
    let banner = await Banner.find({ delete: { $ne: true } })
        res.render("user/home", { product, user: req.session.user,banner });
  
  } catch (error) {
    res.render("admin/error");
  }
};
// Ṃen page
const menView = async (req, res) => {
  try {
    const product = await Product.find({ category: "Mens" })
      .then((product) => {
        res.render("user/men", { product, user: req.session.user });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    res.render("admin/error");
  }
};

// women page
const womenView = async (req, res) => {
  try {
    const product = await Product.find({ category: "Women" })
      .then((product) => {
       
        res.render("user/women", { product, user: req.session.user });
      })
      .catch((err) => {
        console.log(err);
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
      const existProduct = await Cart.findOne({
        owner: req.session.user._id,
        "items.product": productId,
      });
      if (existProduct != null) {
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
      } else {
        const addToCart = await Cart.findOneAndUpdate(
          { owner: req.session.user._id },
          {
            $push: { items: { product: productId, totalPrice: product.price } },
            $inc: { cartTotal: cartTotal, subTotal: product.price },
          }
        );
        addToCart.save().then(() => {
          res.redirect("/productDetails/" + productId);
        });
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

    const cartItems = await Cart.findOne({ owner: userId }).populate("items.product")

    if (cartItems) {
      res.render("user/checkout", {
        user: req.session.user,
        address,
        index,
        cartItems,
        checkAddressErr: req.flash("checkAddressErr"),
        paymentMethodErr: req.flash("paymentMethodErr"),
      });
    } else {
      res.redirect("/cart");
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
      
      const deliveryAddress = address.address.find(
        (el) => el._id.toString() === req.body.address
      );
    //  console.log(deliveryAddress);
      let cart = await Cart.findById(req.body.cartId)
      // const cart = await Cart.findOne({ owner: userId }).populate("items.product")
      //   console.log(cart.items.product);
      //  console.log(cart.items);
       let proId=cart.items.product
      if (req.body.paymentMethod === "cash on delivery") {
       
       
        const paymentMethod = req.body.paymentMethod;
        const newOrder = new Order({
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          userId: userId,
          products: cart.items,
          total: cart.cartTotal,
          address: deliveryAddress,
          paymentMethod: paymentMethod,
          paymentStatus: "Payment Pending",
          orderStatus: "orderconfirmed",
          track: "orderconfirmed",
        });
        newOrder.save().then(async(result) => {
          req.session.orderId = result._id;

          let order = await Order.findOne({ _id: result._id });
            console.log(order,"stock orderrrrrrrrrrrrrrrrrr");
            const findProductId = order.products
       console.log(findProductId,"uddddddddddddddddddd");

       findProductId.forEach(async(el) => {
       let removeQuantity = await Product.findOneAndUpdate({_id:el.product},{$inc:{stock:-el.quantity}})
       });

          Cart.findOneAndRemove({ userId: result.userId }).then((result) => {
            res.json({ cashOnDelivery: true,message:'cod true' });
          });
        });

      }else if(req.body.paymentMethod === "Razorpay"){
       
        const paymentMethod = req.body.paymentMethod;
    
        const newOrder = new Order({
          date :new Date().toLocaleDateString(),
          time:new Date().toLocaleTimeString(),
          userId:userId,
          products:cart.items,
          total:cart.cartTotal,
          address:deliveryAddress,
          paymentMethod:paymentMethod,
          paymentStatus:'Payment Completed',
          orderStatus:'orderconfirmed',
          track:'Shipped',
        });
        newOrder.save().then((result) => {
          let userOrderData = result;

          id = result._id.toString();
          instance.orders.create(
            {
              amount: result.total * 100,
              currency: 'INR',
              receipt: id,
            },
            (err, order) => {
              console.log(err,"errrrrrrrrrrrrrrr");
              console.log(order,"orderrrrrrrrrrrrrrrrrrr");
              let response = {
                Razorpay: true,
                razorpayOrderData: order,
                userOrderData: userOrderData,
                message:'reached message'
              };

              res.json(response);
            }
          );
          // Cart.findOneAndRemove({ userId: result.userId }).then(
          //   (result) => {}
          // );
        });


      } else {
        console.log("choose payment method");
        
        req.flash("paymentMethodErr", "must choose Payment Method ");
        res.redirect("/checkout");
      }
    } else {
      console.log("choose address");
      req.flash("checkAddressErr", "must choose Delivery ddress ");
      res.redirect("/checkout");
    }
  } catch (error) {
    res.render("admin/error");
  }
};

// verify payment 
const verifyPayment=async(req,res)=>{
  try{
  let razorpayOrderDataId = req.body['payment[razorpay_order_id]'];

  let paymentId = req.body['payment[razorpay_payment_id]'];

  let paymentSignature = req.body['payment[razorpay_signature]'];

  let userOrderDataId = req.body['userOrderData[_id]'];

  validate = validatePaymentVerification(
    { order_id: razorpayOrderDataId, payment_id: paymentId },
    paymentSignature,
    'DvG40o8cF8F6bHGUkMHyeMPE'
  );

  if (validate) {
    let order = await Order.findById(userOrderDataId);
    orderStatus = 'Order Placed';
    paymentStatus = 'Payment Completed';
    order.save().then((result) => {
      res.json({ status: true });
    });
    // let order = await Order.findOne({ _id: result._id });
    console.log(order,"stock orderrrrrrrrrrrrrrrrrr");
                const findProductId = order.products
          //  console.log(findProductId,"uddddddddddddddddddd");
           findProductId.forEach(async(el) => {
           let removeQuantity = await Product.findOneAndUpdate({_id:el.product},{$inc:{stock:-el.quantity}})
           });
    Cart.findOneAndRemove({ userId:req.session.user._id}).then(
            (result) => {}
          );
  }
} catch (error) {
  res.render("admin/error");
}
}




// payment   failed
const paymentFailed=  (req, res) => {
  try{
  res.json({ status: true });
} catch (error) {
  res.render("admin/error");
}
}

// order complete

const getOrderComplete =async (req, res) => {
 try{
  res.render("user/order_confirm", { user: req.session.user });
} catch (error) {
  res.render("admin/error");
}

};

// my order page 

const getMyOrder=async(req,res)=>{
  try{
  let orders = await Order.find({userId:req.session.user}).sort({ updatedAt: -1 })
  // console.log(orders,"my orders");
  res.render('user/myOrder',{user:req.session.user,orders})
} catch (error) {
  res.render("admin/error");
}
}

const getOrderDetails = async(req,res)=>{
try{
  console.log(req.query.id);
  let orderDetails = await Order.findOne({_id:req.query.id}).populate("products.product");
  res.render('user/orderDetails',{user:req.session.user,orderDetails})
} catch (error) {
  res.render("admin/error");
}
}

// user profile page
const getProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addresses = await Address.findOne({ user: userId });
    let address;
    if (addresses) {
      address = addresses.address;
    } else {
      address = [];
    }
    res.render("user/profile", { address, user: req.session.user });
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
      editAddressErr:req.flash("editAddressErr") });
  } catch (error) {
    res.render("admin/error");
  }
};

const postEditAddress = async (req, res) => {
try{
  const { country, fName, state, addressLine, city, pincode } = req.body;
  if (country && fName && state && addressLine && city && pincode) {

  const addressId = req.params.id;
  const address = await Address.findOne({ user: req.session.user });

  const updateAddress=await Address.updateMany(
    {
      
      "address._id": addressId,
    },
    {
      $set: {
        "address.$.fName":fName,
        "address.$.pinCode":pincode,
        "address.$.addressLine": addressLine,
        "address.$.city": city,
        "address.$.state": state,
        "address.$.country":country,
      },
      new:true
    },
    {upsert:true}
  ) 
  res.redirect("/profile");
  }else{

    req.flash("editAddressErr", "fill full coloms");
    res.redirect("/editAddress/" +  req.params.id);

  }
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
  getOrderDetails
};
