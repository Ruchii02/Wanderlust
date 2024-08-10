const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const Review = require("./models/reviews.js"); 
const { validateReview, isAuthor } = require("./middleware.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const session = require("express-session");
const flash = require("connect-flash");
const {isLoggedIn, saveRedirectUrl, isOwner, validateListing} = require("./middleware.js");
//const listings = require("./routes/listing.js");

//const userRouter = require("./routes/user.js");
const listingController = require("./controllers/listings.js");
const { createReview } = require("./controllers/reviews.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";



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
 
//app.use("/listings" , listings);
//user route
//  app.use("/" , userRouter);

const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: true ,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

//using session
app.use(session(sessionOptions));
 
//using flash , will be used before routes
app.use(flash());

//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req , res)=>{
  res.send("hi i am root");
});

app.use((req , res , next )=>{
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.currUser = req.user;
   next();
});

//index route
app.get("/listings" ,wrapAsync(listingController.index));

//new route
app.get("/listings/new" ,isLoggedIn, listingController.renderNewForm);
 
//show route
app.get("/listings/:id" ,wrapAsync(listingController.showListing));


//create route
app.post("/listings",isLoggedIn,validateListing ,wrapAsync(listingController.createListing));

//edit
app.get("/listings/:id/edit" ,isLoggedIn,isOwner, wrapAsync(listingController.editListing));

//update route
app.put("/listings/:id",isLoggedIn, isOwner,validateListing , wrapAsync(listingController.updateListing));

//delete route
app.delete("/listings/:id" ,isLoggedIn,isOwner, wrapAsync(listingController.deleteListing));
//review route
const reviewController = require("./controllers/reviews.js");
app.post("/listings/:id/reviews",isLoggedIn, validateReview , wrapAsync(reviewController.createReview));


//delete review route
/*app.delete("/listings/:id/reviews/:reviewId" , isLoggedIn, isAuthor,
  wrapAsync(async(req, res)=>{
    let {id , reviewId} = req.params;
    await Listing.findByIdAndUpdate(id , {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
     
    req.flash("success" , "Review Deleted!");
    res.redirect(`/listings/${id}`);
  })
);
*/
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, isAuthor, wrapAsync(async (req, res) => {
  const { id, reviewId } = req.params;

  // Find and update the listing
  const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect('/listings');
  }

  // Find and delete the review
  const review = await Review.findByIdAndDelete(reviewId);
  if (!review) {
      req.flash("error", "Review not found");
      return res.redirect(`/listings/${id}`);
  }

  req.flash("success", "Review Deleted!");
  res.redirect(`/listings/${id}`);
}));


//signup get

app.get("/signup" , (req , res)=>{
  res.render("users/signup.ejs");
})
//signup post
app.post("/signup" , wrapAsync(async (req , res)=>{
  try{
    let {username , email, password} = req.body;
    const newUser = new User({email, username}); 
    const registeredUser = await User.register(newUser , password);
    console.log(registeredUser);
    req.login(registeredUser , (err)=>{
      if(err){
        return next(err);
      }
      req.flash("success" , "Welcome to Wanderlust!");
      res.redirect("/listings");
    })
  }catch(e){
    req.flash("error" , "User with same username already exists!");
    res.redirect("/signup");
  }
   
}));

//login get 
app.get("/login" , (req , res)=>{
  res.render("users/login.ejs");
});

//login post
app.post(
  "/login" , 
  saveRedirectUrl,
  passport.authenticate("local" ,{ 
    failureRedirect: '/login' ,
     failureFlash: true
    }) ,async(req , res)=>{
       
      req.flash("success" ,"Welcome back to Wanderlust!");
      let redirectUrl = res.locals.redirectUrl||"/listings";
      res.redirect(redirectUrl);
});

//logout route
app.get("/logout" , (req , res , next)=>{
    req.logout((err)=>{
      if(err){
       return next(err);
      }
      req.flash("success" , "You are logged out!");
      res.redirect("/listings");
    })
});

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