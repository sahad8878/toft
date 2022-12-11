const mongoose = require("mongoose");
const { schema } = require("./product");
const moment= require('moment')

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: Array,
    required: true,
  },

},{
  timestamps:true  
 });

let category = mongoose.model("Category", categorySchema);
module.exports =category

