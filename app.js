const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const saltRounds=8;
const date=require(__dirname + "/date.js");

const app=express();

mongoose.connect("mongodb://localhost:27017/projectDB",{useNewUrlParser: true});

const userSchema=new mongoose.Schema ({
    Username: String,
    Password: String,
    PointsLeft: Number,
    PointsGained: Number,
    Recognition: [
        {
            AwardedBy: String,
            Remarks: String,
            PointsGiven: Number,
            RewardedOn: String,
            AwardedTo: String
        }
    ]
});

const User=mongoose.model("User",userSchema);

var name="";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine","ejs");

app.listen(3000,function(){
    console.log("Server set at port 3000");
});

app.get("/",function(req,res){
    res.render("register");
});

app.post("/",function(req,res){
    name=req.body.username;
    User.countDocuments({Username: req.body.username}, function(err,count){
      if (err){
        console.log(err);
        res.redirect("/login");
      }
      if (count>0){
        res.redirect("/login");
      }
    });
    bcrypt.hash(req.body.password, saltRounds, function(err,hash){
      const newUser= new User({
        Username: req.body.username,
        Password: hash,
        PointsLeft: 5000,
        PointsGained: 0,
        Recognition: []
      });
      newUser.save(function(err){
        if (err){
          console.log(err);
        }
        else{
          res.redirect("/home");
        }
      });
    });
});

app.get("/home",function(req,res){
    var ptleft;
    var ptgain;
    let arr=[];
    console.log("In get req");
    console.log(arr);
    User.findOne({Username: name}, function(err,info){
        if (err){
            console.log(err);
        }
        else{
            ptleft=info.PointsLeft;
            ptgain=info.PointsGained;
        }
    });
    console.log("Debug1");
    console.log(arr);
    User.find({}, function(err,info){
        if (err){
            console.log(err);
        }
        else{
            info.forEach(function(data){
                data.Recognition.forEach(function(val){
                    arr.push(val);
                });
            });
            console.log("Array is");
            console.log(arr);
            arr.sort(function(a,b){
                return a.RewardedOn - b.RewardedOn;
            });
            res.render("index",{nameOfUser: name,pointsLeft: ptleft, pointsGained: ptgain, recoDetails: arr});
        }
    });
});

app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){
    let logUser=req.body.username;
    name=logUser;
    User.findOne({Username: req.body.username}, function(err,foundUser){
        if (err){
          console.log(err);
          res.redirect("/");
        }
        else{
          if (foundUser){
            bcrypt.compare(req.body.password, foundUser.Password, function(err,result){
              if (result===true){
                res.redirect("/home");
              }
              else{
                res.redirect("/");
              }
            });
          }
        }
    });
});

app.get("/recognition",function(req,res){
    User.findOne({Username: name}, function(err,info){
        if (err){
            console.log(err);
        }
        else{
            res.render("recognition",{details: info.Recognition});
        }
    });
});

app.post("/recognition", function(req,res){
    res.redirect("/home");
})

app.get("/giveReco",function(req,res){
    res.render("giveRecognition");
});

app.post("/giveReco",function(req,res){
    let givenTouser=req.body.givenTo;
    let ptsAwarded=req.body.pointsGiven;
    let reviewGiven=req.body.remarks;
    if (givenTouser===null || ptsAwarded === null || reviewGiven === null){
      res.send("Please enter valid information");
    }
    let day=date();
    if (givenTouser === name){
        res.send("Error please enter a valid username");
    }
    else{
        User.countDocuments({Username: givenTouser}, function(err,count){
            if (count>0){
                let recObj={AwardedBy: name, Remarks: reviewGiven, PointsGiven: ptsAwarded, RewardedOn: day, AwardedTo: givenTouser};
                User.findOneAndUpdate({Username: givenTouser},{$push: {Recognition: recObj}}, function(err,info){
                    if (err){
                        throw err;
                    }
                    else{
                        console.log("Success");
                    }
                });
                User.findOneAndUpdate({Username: givenTouser},{$inc: {PointsGained: ptsAwarded}}, function(err,info){
                    if (err){
                        throw err;
                    }
                    else{
                        console.log("Success");
                    }
                });
                User.findOneAndUpdate({Username: name},{$inc: {PointsLeft: -ptsAwarded}},function(err,info){
                    if (err){
                        throw err;
                    }
                    else{
                        console.log("Success");
                        res.redirect("/home");
                    }
                });
            }
            else{
                res.send("Enter valid username");
            }
        });
    }
});
