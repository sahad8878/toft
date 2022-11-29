const bcrypt = require("bcrypt");
const Product = require("../models/product");
const user = require("../models/user");
const User = require("../models/user");
const Cart = require("../models/cart");
const Address = require("../models/address");
const { sendSms, verifySms } = require("../verification/otp");

// home
const homeView = (req, res,next) => {
  try {
    

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
} catch (error) {
  res.render('admin/error')
  
}
};
// Ṃen page
const menView = async (req, res) => {
  try {
    
 
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
} catch (error) {
  res.render('admin/error')
}
};

// women page
const womenView = async (req, res) => {
  try {
    
 
  const product = await Product.find({ category: "Women" })
    .then((product) => {
      //  console.log(product);
      res.render("user/women", { product, user: req.session.user });
    })
    .catch((err) => {
      console.log(err);
    });
  } catch (error) {
    res.render('admin/error')
  }
};
// aboute page
const aboutView = (req, res) => {
  try{
  let user = req.session.user;
  res.render("user/about", {
    Product: Product,
    user: user,
  });
} catch (error) {
  res.render('admin/error')
}
};
// contact page
const contactView = (req, res) => {
  try{
  let user = req.session.user;
  res.render("user/contact", { user: user });
} catch (error) {
  res.render('admin/error')
}
};

//get cart page

const cartView = async (req, res) => {
  try{
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
} catch (error) {
  res.render('admin/error')
}
};

// post cart

const addToCart = async (req, res) => {
  try{
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
            cartTotal: product.price,
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
} catch (error) {
  res.render('admin/error')
}
};

// delete cart product

const deleteCartProduct = async (req, res) => {
  try{
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
} catch (error) {
  res.render('admin/error')
}
};

// cart product  quantity change
const cartChangeQuantity = async (req, res) => {
  try{
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
} catch (error) {
  res.render('admin/error')
}
};
// get login
const loginView = (req, res) => {
  try{
  res.render("user/login", {
    emailErr: req.flash("emailErr"),
    passErr: req.flash("passErr"),
    fillErr: req.flash("fillErr"),
  });
} catch (error) {
  res.render('admin/error')
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
          req.session.loggedIn = true;
          req.session.user = user;
          res.redirect("/");
          console.log("login succeded");
        } else {
          req.flash("passErr", "password not match");
          res.redirect("/login");
        }
      } else {
        req.flash("emailErr", "Email  not match");
        res.redirect("/login");
      }
      // console.log("compare", compare);
      // if (!compare) {
      //   req.flash('passErr','password not match')
      //   return res.redirect("/login");
      // }
      // // req.loggedIn=false;
      // req.session.loggedIn = true;
      // req.session.user = user;

      // return res.redirect("/"), console.log("login succes");
      // // req.locals.user=user || null;
    } else {
      req.flash("fillErr", "fill the colom");
      res.redirect("/login");
    }
  } catch (error) {
    res.render('admin/error')
  }
};

// register page
const registerView = (req, res) => {
  try{
  res.render("user/register", {
    registerErr: req.flash("registerErr"),
    existErr: req.flash("existErr"),
  });
} catch (error) {
  res.render('admin/error')
}
};

// register post
const registerUser = async (req,res) => {
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
    res.render('admin/error')
  }
};
const postOtp = async (req, res) => {
  try{
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
      req.flash('otpErr','otp not match')
      res.redirect("/otp");
      console.log("otp failed");
    }
  });
} catch (error) {
  res.render('admin/error')
}
};

// logout user
const logoutUser = (req, res) => {
  try{
  req.session.destroy();
  res.redirect("/");
} catch (error) {
  res.render('admin/error')
}
};

// products details page
const productDetails = (req, res) => {
  try{
  const proId = req.params.id;
  let user = req.session.user;

  Product.findById(proId).then((product) => {
    res.render("user/product_details", { product, proId, user: user });
  });
} catch (error) {
  res.render('admin/error')
}
};

// otp section
const getOtp = (req, res) => {
try{
  res.render("user/otp",{otpErr:req.flash('otpErr')});
} catch (error) {
  res.render('admin/error')
}
};

// resend otp
const resendOtp = (req, res) => {
try{
  const { number } = req.session.user;
  const phone = number;
  console.log(phone);
  sendSms(phone);
  res.redirect("/otp");
} catch (error) {
  res.render('admin/error')
}
};

// checkout page
const getCheckout = async (req, res) => {
  try{
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
  const cartItems = await Cart.findOne({ owner: userId });
  if (cartItems) {
    res.render("user/checkout", {
      user: req.session.user,
      address,
      index,
      cartItems,
    });
  } else {
    res.redirect("/login");
  }
} catch (error) {
  res.render('admin/error')
}
};
//  catch {
//   res.json("Something wrong, please try again");
// }
//   res.render("user/checkout", { user: req.session.user });
// };
// user profile page
const getProfile = async (req, res) => {
  try{
  let userDB = await User.find({});
  const address = await Address.findOne({ owner: req.session.user })
  .populate({ path: "user", select: "name email number" });
  // .then((address)=>{
  res.render("user/profile", { address, user: req.session.user });
} catch (error) {
  res.render('admin/error')
}
};

// add address button
const getAddress = (req, res) => {
  try{
  res.render("user/address", { user: req.session.user,addressErr:req.flash('addressErr') });
} catch (error) {
  res.render('admin/error')
}
};

const postAdress = async (req, res) => {
  try{
  const { country, fName, state, addressLine, city, pincode } = req.body;
  if (country && fName && state && addressLine && city && pincode) {
    // const newAddress = await Address({
    //   owner: req.session.user._id,
    //   country: country,
    //   fName: fName,
    //   state: state,
    //   addressLine: addressLine,
    //   city: city,
    //   pincode: pincode,
    // });
    // newAddress.save().then(() => {
    //   res.redirect("/profile");
    // });
    ownerId = req.session.user._id;
    // console.log(req.body);
    const user = await User.findOne({ _id: ownerId });
    // console.log(user);
    const newAddress = await new Address({
      user: user,
      address: {
        country: country,
        fName: fName,
        state: state,
        addressLine: addressLine,
        city: city,
        pincode: pincode,
      },
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
    req.flash('addressErr','fill full coloms')
    res.redirect("/address");
  }
} catch (error) {
  res.render('admin/error')
}
};
const deleteAddress = (req, res) => {
  try{
  const addressId = req.params.id;
  console.log(addressId);
  console.log(addressId);
  Address.findByIdAndRemove(addressId).then((address) => {
    console.log("address deleted");
    res.redirect("/profile");
  });
} catch (error) {
  res.render('admin/error')
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
  deleteAddress,
  resendOtp,
};
