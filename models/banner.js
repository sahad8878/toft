const mongoose = require("mongoose")

const BannerSchema = new mongoose.Schema({

    head1: {
        type : String,
        required : true
    },
    head2: {
        type : String,
        required : true
    },
    head3: {
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
    },
    offer:{
        type:Number,
        default: 0
      }

    
},{
    timestamps:true  
   })

const Banner = mongoose.model("Banner",BannerSchema)

module.exports= Banner