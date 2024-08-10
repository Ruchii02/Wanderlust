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
 
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const session = require("express-session");
const flash = require("connect-flash");
const {isLoggedIn} = require("./middleware.js");
//const listings = require("./routes/listing.js");

//const userRouter = require("./routes/user.js");


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
   next();
});

/*app.get("/demouser" ,async (req , res)=>{
  let fakeUser = new User ({
    email: "abc@gamil.com",
    username: "hello",
  })

  let registeredUser = await User.register(fakeUser , "hey123");
  res.send(registeredUser);
});*/

//signup get

/*app.get("/signup" , (req , res)=>{
  res.render("users/signup.ejs");
})

app.post("/signup" ,async (req , res)=>{
   let {username , email, password} = req.body;
   const newUser = new User(email, username); 
   const registeredUser = await User.register(newUser , password);
   console.log(registeredUser);
   req.flash("success" , "Welcome to Wanderlust!");
   res.redirect("/listings");
});*/

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

//index route
app.get("/listings" ,wrapAsync(async (req , res)=>{
  const allListings = await Listing.find({});
  res.render("listings/index.ejs" , { allListings });
}));

//new route
app.get("/listings/new" ,isLoggedIn, (req ,res)=>{
  console.log(req.user);
  res.render("listings/new.ejs");
 });
 
//show route
app.get("/listings/:id" ,wrapAsync(async(req , res )=>{
let {id} = req.params;
 const listing = await Listing.findById(id).populate("reviews");
 
 if(!listing){
  req.flash("error" , "Listing you requested for does not exist!");
  res.redirect("/listings");
 }

 res.render("listings/show.ejs" , {listing}); 
}));


//create route
app.post("/listings",isLoggedIn,validateListing ,wrapAsync(async (req , res , next)=>{
//let listing = req.body.listing;
   //if(!req.body.listing){
   // throw new ExpressError(400 , "Send a valid data for listing");
  // }
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  req.flash("success" , "New Listing Created!");
  res.redirect("/listings")

}));

//edit
app.get("/listings/:id/edit" ,isLoggedIn, wrapAsync(async(req , res)=>{
  let {id} = req.params;
 const listing = await Listing.findById(id);

 if(!listing){
  req.flash("error" , "Listing you requested for does not exist!");
  res.redirect("/listings");
 }

 res.render("listings/edit.ejs" , {listing});
}));

//update route
app.put("/listings/:id",isLoggedIn,validateListing , wrapAsync(async(req ,res)=>{
  let {id} = req.params;
  await  Listing.findByIdAndUpdate(id , {...req.body.listing});
  req.flash("success" , "Listing Updated!");
  res.redirect(`/listings/${id}`);
}));

//delete route
app.delete("/listings/:id" ,isLoggedIn, wrapAsync(async(req, res)=>{
  let {id} = req.params;
  let delListing =  await Listing.findByIdAndDelete(id);
  console.log(delListing);
  req.flash("success" , "Listing Deleted!");
  res.redirect("/listings");
}));

//review route

app.post("/listings/:id/reviews", validateReview , wrapAsync(async(req,res)=>{
  let {id} = req.params
  let listing = await Listing.findById(id);
  let newReview = new Review(req.body.review); 

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  console.log("new review saved");
  req.flash("success" , "New Review Created!");
  res.redirect(`/listings/${listing._id}`);
}));


//delete review route
app.delete("/listings/:id/reviews/:reviewId" , 
  wrapAsync(async(req, res)=>{
    let {id , reviewId} = req.params;
    await Listing.findByIdAndUpdate(id , {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
     
    req.flash("success" , "Review Deleted!");
    res.redirect(`/listings/${id}`);
  })
);

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
    req.flash("success" , "Welcome to Wanderlust!");
    res.redirect("/listings");
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
  passport.authenticate("local" ,{ 
    failureRedirect: '/login' ,
     failureFlash: true
    }) ,async(req , res)=>{
       
      req.flash("success" ,"Welcome back to Wanderlust!");
      res.redirect("/listings");
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