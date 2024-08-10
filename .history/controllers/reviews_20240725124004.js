const Listing = require("../models/listing");
const Review = require("../models/review");


module.exports.createReview = async(req,res)=>{
    let {id} = req.params
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body.review); 
     newReview.author = req.user._id;
    listing.reviews.push(newReview);
  
    await newReview.save();
    await listing.save();
    console.log("new review saved");
    req.flash("success" , "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
  };