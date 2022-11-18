const bcrypt = require("bcrypt");
const Product = require("../models/product");
const User = require("../models/user");
const { sendSms, verirySms, verifySms } = require("../verification/otp");

// home
const homeView = (req, res) => {
  Product.find()
    .then((product) => {
      // console.log(product)
      res.render("user/home", { product });
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
const menView = (req, res) => {
  res.render("user/men", {
    Product: Product,
    User: User,
    isAuthenticated: req.loggedIn,
  });
};

// women page
const womenView = (req, res) => {
  res.render("user/women", {
    Product: Product,
    User: User,
    isAuthenticated: req.loggedIn,
  });
};
// aboute page
const aboutView = (req, res) => {
  res.render("user/about", {
    Product: Product,
    User: User,
    isAuthenticated: req.loggedIn,
  });
};
// contact page
const contactView = (req, res) => {
  res.render("user/contact", {
    Product: Product,
    User: User,
    isAuthenticated: req.loggedIn,
  });
};

// cart page
const cartView = (req, res) => {
  res.render("user/cart", {
    Product: Product,
    User: User,
    isAuthenticated: req.loggedIn,
  });
};

// login
const loginView = (req, res) => {
  res.render("user/login", {
    isAuthenticated: req.loggedIn,
  });
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
    return res.redirect("/"), console.log("login succes");
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

    User.findOne({ email: email }).then(async (user) => {
      if (!user) {
        req.session.user = req.body;
        sendSms(number);
        res.redirect("/otp");
      } else {
        return res.redirect("/login");
      }
    });
  } catch (error) {
    console.log("error");
    console.log(error.message);
  }
};
const postOtp = async (req, res) => {
  const { name, number, email, password } = req.session.user;
  const otp = req.body.otp;
  const phone = number;
  console.log(phone)
  await verifySms(phone, otp).then(async(verification_check) => {
    if (verification_check.status == "approved") {

      const hashPassword= await bcrypt.hash(password,10)
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
// const logoutUser= (req, res) => {
//   res.redirect("user/home");
// };

const productDetails = (req, res) => {
  const proId = req.params.id;
  console.log(proId);
  Product.findById(proId).then((product) => {
    res.render("user/product_details", { product, proId });
  });
};
// otp section
const getOtp = (req, res) => {
  res.render("user/otp");
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

  // logoutUser
};
