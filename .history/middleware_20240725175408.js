const Listing = require("./models/listing.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const Review = require("./models/reviews.js");


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
  next();
}


module.exports.validateListing = (req , res , next) => {
  let {error} = listingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400 , errMsg);
  }else{
    next();
  }
};

module.exports.validateReview = (req , res , next) => {
  let {error} = reviewSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400 , errMsg);
  }else{
    next();
  }
}

/*module.exports.isAuthor = async(req , res , next)=>{
  let {id ,reviewId} = req.params;
let review = await Review.findById(reviewId);
if(!review.author.equals(res.locals.currUser._id)){
  req.flash("error", "You don't have access!");
  return res.redirect(`/listings/${id}`);
}
next();
}*/

module.exports.isAuthor = async (req, res, next) => {
  try {
      const { id, reviewId } = req.params;
      const review = await Review.findById(reviewId);

      if (!review) {
          req.flash("error", "Review not found");
          return res.redirect(`/listings/${id}`);
      }

      if (!review.author.equals(res.locals.currUser._id)) {
          req.flash("error", "You don't have access!");
          return res.redirect(`/listings/${id}`);
      }

      next();
  } catch (error) {
      console.error("Error in isAuthor middleware:", error);
      req.flash("error", "An error occurred while verifying author");
      res.redirect(`/listings/${id}`);
  }
};
