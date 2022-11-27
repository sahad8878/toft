const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema ({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
        
        fName:{
            type : String,
            required : true
        },
       
        pincode:{
            type: Number,
            required : true
        },
        addressLine:{
            type : String,
            required : true
        },
        city:{
            type : String,
            required : true
        },
        state:{
            type : String,
            required : true
        },
        

})

const address = mongoose.model("Address",addressSchema)
module.exports = address