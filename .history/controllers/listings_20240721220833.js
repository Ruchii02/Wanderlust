const Listing = require("../models/listing.js");


module.exports.index = async (req , res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs" , { allListings })
};

module.exports.renderNewForm = (req ,res)=>{
    console.log(req.user);
    res.render("listings/new.ejs");
};