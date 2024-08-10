const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");
//const Review = require("./models/reviews.js");
const listingSchema = new Schema({
    title :{ 
        type:String,
        required : true,
    },
    description: String,
    image:{
        default:"https://www.istockphoto.com/photo/maldives-tropical-island-gm1360554439-433537932" ,
        type:String,
        set: (v)=> 
        v === "" ? "https://www.istockphoto.com/photo/maldives-tropical-island-gm1360554439-433537932" : v,
    },
    price:Number,
    location:String,
    country:String,
    reviews: [
        {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    owner: [{
        type : Schema.Types.ObjectId,
        username: String,
        ref: "User",
    }],
});

listingSchema.post("findOneAndDelete" , async(listing)=>{
   if(listing){
    await Review.deleteMany({_id : {$in: listing.reviews}});
   }
    
});

//create model using listing schema

const Listing = mongoose.model("Listing" , listingSchema);
module.exports = Listing;