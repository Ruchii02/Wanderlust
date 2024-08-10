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
    throw new ExpressError(400 , error);
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
app.get("/listings/new" , (req ,res)=>{
  res.render("listings/new.ejs");
 });
 
//show route
app.get("/listings/:id" ,wrapAsync(async(req , res )=>{
let {id} = req.params;
 const listing = await Listing.findById(id);
res.render("listings/show.ejs" , {listing}); 
}));


//create route
app.post("/listings",validateListing ,wrapAsync(async (req , res , next)=>{
//let listing = req.body.listing;
   //if(!req.body.listing){
   // throw new ExpressError(400 , "Send a valid data for listing");
  // }
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings")

}));

//edit
app.get("/listings/:id/edit" , wrapAsync(async(req , res)=>{
  let {id} = req.params;
 const listing = await Listing.findById(id);
 res.render("listings/edit.ejs" , {listing});
}));

//update route
app.put("/listings/:id",validateListing , wrapAsync(async(req ,res)=>{
  let {id} = req.params;
  await  Listing.findByIdAndUpdate(id , {...req.body.listing});
  res.redirect(`/listings/${id}`);
}));

//delete route
app.delete("/listings/:id" , wrapAsync(async(req, res)=>{
  let {id} = req.params;
  let delListing =  await Listing.findByIdAndDelete(id);
  console.log(delListing);
  res.redirect("/listings");
}));

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