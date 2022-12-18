
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
  products:[{
    product:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    },
    quantity:{
        type: Number,
        default: 1
    },
    totalPrice: {
        type: Number,
        default:0
    },
    
}],
  total: {
    type: Number,
    required: true,
  },
  address: {
    fName: String,
    addressLine: String,
    city: String,
    country: String,
    state:String,
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
    type:String,
  },
  useWallet:{
    type:Number,
  },
  couponDiscount:{
    type:Number,
  },

},{
  timestamps:true  
 });

const Order = mongoose.model("Order", oderSchema);

module.exports = Order;