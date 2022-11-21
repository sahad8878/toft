const mongoose = require("mongoose");
const { schema } = require("./product");
const moment= require('moment')

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  discription: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: true,
  },




});

module.exports  = mongoose.model("Category", categorySchema);

