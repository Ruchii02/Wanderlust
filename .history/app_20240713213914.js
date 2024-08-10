const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");
const Review = require("./models/reviews.js");
const {reviewSchema} = require("./schema.js");
 
const listings = require("./routes/listing.js");

main().then(()=>{
  console.log("connected to db");
}).catch((err)=>{
  console.log(err);
});


async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname , "views"));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname , "/public")));
 
app.use("/listings" , listings);

/*app.get("/testListing" , async(req , res)=>{
  let sampleListing = new Listing({
    title: "My New Villa",
    description:" By The Beach",
    price:1200,
    location:"Goa",
    country: "India"
  });

  await sampleListing.save();
  console.log("sample saved");
  res.send("successful");
});*/


app.get("/", (req , res)=>{
  res.send("hi i am root");
});

const validateListing = (req , res , next) => {
  let {error} = listingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400 , errMsg);
  }else{
    next();
  }
}

const validateReview = (req , res , next) => {
  let {error} = reviewSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400 , errMsg);
  }else{
    next();
  }
}



//review route

app.post("/listings/:id/reviews", validateReview , wrapAsync(async(req,res)=>{
  let {id} = req.params
  let listing = await Listing.findById(id);
  let newReview = new Review(req.body.review); 

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  console.log("new review saved");
  res.redirect(`/listings/${listing._id}`);
}));


//delete review route
app.delete("/listings/:id/reviews/:reviewId" , 
  wrapAsync(async(req, res)=>{
    let {id , reviewId} = req.params;
    await Listing.findByIdAndUpdate(id , {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  })
);

app.all("*" , (req , res , next)=>{
  next(new ExpressError(404 , "Page Not Found!"));
});


//middleware to handle error
app.use((err , req , res , next)=>{
  let { statusCode=500 , message="Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs" ,{ err });
  //res.status(statusCode).send(message);

});


app.listen(8080 , (req , res)=>{
    console.log("working");
});