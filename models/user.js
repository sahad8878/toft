const moment = require("moment");
const mongoose = require("mongoose");
const { schema } = require("./product");


const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: Date.now
  },
  access: {
    type: Boolean,
   default:true
  },
  wallet: {
    type: Number,
    default:0,
  },
},{
  timestamps:true  
 });
 
 const user=mongoose.model("User", UserSchema); 
 module.exports=user