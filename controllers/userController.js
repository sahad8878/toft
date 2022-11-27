const bcrypt = require("bcrypt");
const Product = require("../models/product");
const user = require("../models/user");
const User = require("../models/user");
const Cart = require("../models/cart");
const Address = require("../models/address");
const { sendSms, verifySms } = require("../verification/otp");

// home
const homeView = (req, res) => {
  let user = req.session.user;
  Product.find()
    .then((product) => {
      // console.log(product)

      res.render("user/home", { product, user: user });
    })
    .catch((err) => {
      console.log(err);
    });

  // res.render("user/home",
  // {Product:Product,
  //   User:User,
  //   isAuthenticated:req.loggedIn});
};
// Ṃen page
const menView = async (req, res) => {
  const product = await Product.find({ category: "Mens" })
    .then((product) => {
      //  console.log(product);
      res.render("user/men", { product, user: req.session.user });
    })
    .catch((err) => {
      console.log(err);
    });

  // res.render("user/men", {
  //   Product: Product,
  //   User: User,
  //   isAuthenticated: req.loggedIn,
  // });
};

// women page
const womenView = async (req, res) => {
  const product = await Product.find({ category: "Women" })
    .then((product) => {
      //  console.log(product);
      res.render("user/women", { product, user: req.session.user });
    })
    .catch((err) => {
      console.log(err);
    });
};
// aboute page
const aboutView = (req, res) => {
  let user = req.session.user;
  res.render("user/about", {
    Product: Product,
    user: user,
  });
};
// contact page
const contactView = (req, res) => {
  let user = req.session.user;
  res.render("user/contact", { user: user });
};

//get cart page

const cartView = async (req, res) => {
  let ownerId = req.session.user._id;

  const cartItems = await Cart.findOne({ owner: ownerId })
    .populate("items.product")
    .exec((err, allCart) => {
      if (err) {
        return console.log(err);
      }
      // console.log(allCart);
      res.render("user/cart", {
        allCart,
        user: req.session.user,
      });
    });

  // res.render("user/cart", {
  //   Product: Product,
  //   user:user,
  // });
};

// post cart

const addToCart = async (req, res) => {
  const productId = req.params.id;
  let ownerId = req.session.user._id;
  console.log(ownerId);
  console.log(productId + "its product id");
  const user = await Cart.findOne({ owner: req.session.user._id });
  const product = await Product.findOne({ _id: productId });
  // console.log(product+"its product id");
  const cartTotal = product.price;
  if (!user) {
    const addToCart = await Cart({
      owner: req.session.user._id,
      items: [{ product: productId, totalPrice: product.price }],
      cartTotal: cartTotal,
    });
    addToCart.save().then(() => {
      res.redirect("/productDetails/");
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
          $inc: { cartTotal: cartTotal },
        }
      );
      addToCart.save().then(() => {
        res.redirect("/productDetails/" + productId);
      });
    }
  }
};

// delete cart product

const deleteCartProduct = async (req, res) => {
  console.log("delete starting");
  const userId = req.session.user;
  const productId = req.params.productId;
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
    res.redirect("/cart");
  });
};

// cart product  quantity change
const cartChangeQuantity = async (req, res) => {
  const { cartId, productId, count } = req.params;
  const product = await Product.findOne({ _id: productId });
  if (count == 1) var productPrice = product.price;
  else {
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
    res.redirect("/cart");
  });
};
// login
const loginView = (req, res) => {
  res.render("user/login");
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email: email });
    let compare = await bcrypt.compare(password, user.password);
    if (!user) {
      return res.redirect("/login");
    }
    console.log("compare", compare);
    if (!compare) {
      return res.redirect("/login");
    }
    // req.loggedIn=false;
    req.session.loggedIn = true;
    req.session.user = user;

    return res.redirect("/"), console.log("login succes");
    // req.locals.user=user || null;
  } catch (error) {
    console.log(error.message);
  }
};

// register page
const registerView = (req, res) => {
  res.render("user/register");
};

// register post
const registerUser = async (req, res) => {
  try {
    const { name, number, email, password } = req.body;
if(name&& number&& email&& password ){
    User.findOne({ email: email }).then(async (user) => {
      if (!user) {
        req.session.user = req.body;
        sendSms(number);
        res.redirect("/otp");
      } else {
        return res.redirect("/login");
      }
    });
  }else{
    res.redirect("/register");
    console.log("fill register page");
   
  }
  } catch (error) {
    console.log("error");
    console.log(error.message);
  }
};
const postOtp = async (req, res) => {
  const { name, number, email, password } = req.session.user;
  const otp = req.body.otp;
  const phone = number;
  console.log(phone);
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
      console.log("otp failed");
    }
  });
};

// logout user
const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};

// products details page
const productDetails = (req, res) => {
  const proId = req.params.id;
  let user = req.session.user;

  Product.findById(proId).then((product) => {
    res.render("user/product_details", { product, proId, user: user });
  });
};

// otp section
const getOtp = (req, res) => {
  res.render("user/otp");
};

// checkout page
const getCheckout = (req, res) => {
  res.render("user/checkout", { user: req.session.user });
};
// user profile page
const getProfile = async (req, res) => {
  // let adress = await Address.find();
  // let userDb= await User.find()

  res.render("user/profile", { user: req.session.user });
};

// add address button
const getAddress = (req, res) => {
  res.render("user/address", { user: req.session.user });
};

const postAdress = async (req, res) => {
  ownerId = req.session.user._id;
  console.log(req.body);
  const { country, fName, state, addressLine, city, pincode } = req.body;
  if (country && fName && state && addressLine && city && pincode) {
    const user = await User.findOne({ _id: ownerId });
    console.log(user);
    const newAddress = await new Address({
      user: user,
      country: country,
      fName: fName,
      state: state,
      addressLine: addressLine,
      city: city,
      pincode: pincode,
    });
    newAddress
      .save()
      .then((result) => {
        console.log("created Address");
        res.redirect("/profile");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.redirect("/address");
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
  logoutUser,
  addToCart,
  deleteCartProduct,
  cartChangeQuantity,
  getCheckout,
  getProfile,
  getAddress,
  postAdress,
};
