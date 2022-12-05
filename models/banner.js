const mongoose = require("mongoose")

const BannerSchema = new mongoose.Schema({

    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    imageUrl :{
        type : Array,
        required : true
    },
    route:{
        type: String
    },
    delete: {
        type:Boolean,
          default: false
    }

    
},{
    timestamps:true  
   })

const Banner = mongoose.model("Banner",BannerSchema)

module.exports= Banner