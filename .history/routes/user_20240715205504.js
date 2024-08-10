const express = require("express");
const router = express.Router();
//const session = require("express-session");
const flash = require("connect-flash");


//router.use(session(sessionOptions));
 
//using flash , will be used before routes
router.use(flash());




router.get("/login" , (req , res)=>{
  res.render("users/login.ejs");
});


module.exports = router;