
const User = require("../models/user");
const userSession= (req,res,next)=>{
    if(req.session.loggedIn){
   next();
    }else{
        res.redirect("/login");
    }
}
const checkBlock= async(req,res,next)=>{
    let user = await User.findOne({ _id:req.session.user._id})
    if(user.access){
        next();
    }else{

        res.render("user/blocked",{user:req.session.user});
        req.session.destroy()
    }
}

const noSession= (req,res,next)=>{
    if(req.session.loggedIn){
        res.redirect("/");
    }else{
        next();
    }
        
}


module.exports={userSession,checkBlock,noSession}