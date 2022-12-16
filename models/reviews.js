const mongoose = require('mongoose')
var moment = require('moment');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        title: {
            type: String,
        },

        review: {
            type: String,
            required: true
        },

        rating: {
            type: Number
        },
        date: {
            type: String,
            default: moment(Date.now()).format('DD-MM-YYYY')
        }       
    }
)

const review = mongoose.model('Reviews', reviewSchema)
module.exports = review

