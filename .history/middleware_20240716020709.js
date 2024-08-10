const Listing = require("./models/listing.js");

module.exports.isLoggedIn = (req , res , next )=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error" , "you must be logged in to make changes!");
         return res.redirect("/login");
      }
      next();
};

module.exports.saveRedirectUrl = (req , res , next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async(req , res , next)=>{
    let {id} = req.params;
  let listing = await Listing.findById(id);
  if(!listing.owner._id.equals(res.locals.currUser._id)){
    req.flash("error", "You don't have access!");
    return res.redirect(`/listings/${id}`);
  }
}