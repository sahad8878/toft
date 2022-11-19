const userSession= (req,res,next)=>{
    if(req.session.loggedIn){
   next();

    }else{
        res.redirect("/login");
    }
}
const noSession= (req,res,next)=>{
    if(!req.session.loggedIn){
   next();

    }else{
        res.redirect("/");
    }
}


module.exports={userSession,noSession}