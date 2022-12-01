
const mongoose = require("mongoose");
const { array } = require("../middlewares/multer");

const oderSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: {
    
  },
  total: {
    type: Number,
    required: true,
  },
  address: {
    fName: String,
    addressLan: String,
    city: String,
    country: String,
    pincode: Number,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    required: true,
  },
  orderStatus: {
    type: String,
    required: true,
  },
  track:{
    type: String,
  },
  returnreason:{
    trpe:String,
  }

},{
  timestamps:true  
 });

const Order = mongoose.model("Order", oderSchema);

module.exports = Order;