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
 location: {     
   type: String,    
   default: "New York",
   },
  date: {
    type: String,
    default: Date.now
  },
  access: {
    type: Boolean,
   default:true
  },
  // cart: {
  //   items: [
  //     {productId:{
  //       type: Schema.Types.ObjectId, ref:'product', required: true,
  //     },
  //     quantity: {
  //       type: Number,
  //       required: true,
  //     }
  //   }
  //   ]
  // }
},{
  timestamps:true  
 });
 
 const user=mongoose.model("User", UserSchema); 
 module.exports=user