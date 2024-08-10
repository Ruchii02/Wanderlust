if(process.env.NODE_ENV !="production"){
  require('dotenv').config();
}

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

const listingController = require("./controllers/listings.js");
const  reviewController  = require("./controllers/reviews.js");
const userController = require("./controllers/users.js");

const multer  = require('multer');
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });
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

//app.get("/", (req , res)=>{
//  res.send("hi i am root");
//});

app.use((req , res , next )=>{
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.currUser = req.user;
   next();
});

//index route
app.get("/listings",wrapAsync(listingController.index));

//new route
app.get("/listings/new" ,isLoggedIn, listingController.renderNewForm);
 
//show route
app.get("/listings/:id" ,wrapAsync(listingController.showListing));


//create route
app.post("/listings",isLoggedIn,upload.single('listing[image]'),
/*validateListing*/wrapAsync(listingController.createListing));

//edit
app.get("/listings/:id/edit" ,isLoggedIn,isOwner, wrapAsync(listingController.editListing));

//update route
app.put("/listings/:id",isLoggedIn, isOwner,upload.single('listing[image]'),validateListing, wrapAsync(listingController.updateListing));

//delete route
app.delete("/listings/:id" ,isLoggedIn,isOwner, wrapAsync(listingController.deleteListing));
//review route

app.post("/listings/:id/reviews",isLoggedIn, validateReview , wrapAsync(reviewController.createReview));


//delete review route
app.delete("/listings/:id/reviews/:reviewId" , isLoggedIn, isAuthor,
  wrapAsync(reviewController.destroyReview)
);

//signup get

app.get("/signup" , userController.renderSignup);
//signup post
app.post("/signup" , wrapAsync(userController.signup));

//login get 
app.get("/login" , userController.renderLogin);

//login post
app.post(
  "/login" , 
  saveRedirectUrl,
  passport.authenticate("local" ,{ 
    failureRedirect: '/login' ,
     failureFlash: true
    }) ,userController.login);

//logout route
app.get("/logout" , userController.logout);

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