const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js"); //require model


main().then(()=>{
    console.log("connected to db");
  }).catch((err)=>{
    console.log(err);
  });
  
  
  async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
  }
  

  const initDB = async()=>{
    await Listing.deleteMany({});
    initData.data.map((obj)=>({...obj  , owner:"66220fb20f20f1d77629e2d9"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");

  };

  initDB();