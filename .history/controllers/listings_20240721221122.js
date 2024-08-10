const Listing = require("../models/listing.js");


module.exports.index = async (req , res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs" , { allListings })
};

module.exports.renderNewForm = (req ,res)=>{
    console.log(req.user);
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req , res )=>{
    let {id} = req.params;
     const listing = await Listing.findById(id).populate({path: "reviews",
      populate: {
        path: "author",
      },
     }).populate("owner");
     console.log(listing);
     if(!listing){
      req.flash("error" , "Listing you requested for does not exist!");
      res.redirect("/listings");
     }
    
     res.render("listings/show.ejs" , {listing}); 
}