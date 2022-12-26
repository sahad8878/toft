const express = require("express");
// const expressLayouts=require('express-ejs-layouts')
const path=require('path')
const logger=require('morgan')
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require('body-parser')
const session = require('express-session')
const cookieParser= require('cookie-parser')
var flash = require('connect-flash');
dotenv.config();
const app = express();

// const mongoDbStore = require('connect-mongodb-session')(session)

const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");


const User = require('./models/user')
const { Template } = require("ejs");
const { application } = require("express");

app.use( (req,res,next) =>{
  res.header('Cache-Control','private ,no-cache, no-store, must-revalidate')
  next()
})

// statac file
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('views', __dirname+ '/views');
// static user files
app.use('/css',express.static(__dirname+"/public/user/css"))
app.use('/js',express.static(__dirname+"/public/user/js"))
app.use('/images',express.static(__dirname+"/public/user/images"))
app.use('/fonts',express.static(__dirname+"/public/user/fonts"))
app.use('/sass',express.static(__dirname+"/public/user/sass"))
app.use('/.sass-cache',express.static(__dirname+"/public/user/.sass-cache"))
// static admin files
app.use('/css',express.static(__dirname+"/public/admin/css"))
app.use('/js',express.static(__dirname+"/public/admin/js"))
app.use('/img',express.static(__dirname+"/public/admin/img"))

// app.set('layout','./layouts/layout')
// set Template engin
// app.use(expressLayouts)
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: false}))
// app.use(express.urlencoded({extended: false}));
app.use(logger('dev'));
app.use(session({secret:"key",resave:true,saveUninitialized:true,cookie:{maxAge:1200000}}));
app.use(cookieParser())
app.use(express.json())
app.use(flash());

app.use("/", userRouter);
app.use("/admin", adminRouter);

// database connection
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.DATABASE, {
    //  .connect(process.env.LOCAL_DATABASE,{
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
.then(result =>{
    app.listen(PORT,()=>{
      console.log('server connected')
    })
  })
  .catch((err) => console.log(err));


// error page 404
app.use(function (req, res, next) {
    res.status(404)
if(req.accepts('html')){
  res.render('admin/error')
}
  })



// port connections

// app.listen(PORT, console.log(`"server done start for ${PORT}"`));
