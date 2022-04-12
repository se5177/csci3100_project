var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const { route, head } = require('../app.js');
const { user } = require('../models/schemas.js');
var Schema = require('../models/schemas.js');
var User_data = require('./users');
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const passwordSchema = Joi.object({
  OldPassword: Joi.string(),
  NewPassword: Joi.string().regex(/^[a-zA-Z0-9]{5,15}$/).required(),
  Conpassword: Joi.any().valid(Joi.ref('NewPassword')).required()

});

//new
const multer = require("multer");
//new
const imageModel = require("../models/upload");
const { schema } = require('../models/upload');
//new

router.use(express.static("/public/images"));

//new
var Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./public/images");
  },
  filename: function (req, file, callback) {

    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});


//new
var upload = multer({
  storage: Storage,
  limit: {
    fieldSize: 1024 * 1024 * 3,
  }
}).single("image"); //Field name and max count





global.temp = "";

/* GET home page. */
router.get('/shop', async (req, res, next) => {
  let products = Schema.products;
  let productsResult = await products.find({}).exec((err, productsData) => {
    if (productsData) {
      var productsChunks = [];
      var chunkSize = 3;
      for (var i = 0; i < productsData.length; i += chunkSize) {
        productsChunks.push(productsData.slice(i, i + chunkSize));
      }

      mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
        if (err) {
          console.log(err);
          return;
        } else {
          res.render('shop/shop', { money: Users_Result.Money, data: productsData });
        }
      });
    }
  });

});

router.post('/shop', function (req, res) {

  temp = req.body.item;
  console.log("rBody:", temp);
  res.redirect('/itempage');

});











router.post('/itempage', async (req, res) => {
  console.log("price", req.body);

  mongoose.model('user').findOne({ email: User_data.loginEmail }, async (err, temp_User) => {
    if (err) {
      console.log(err);
      return;
    }

    mongoose.model('products').findOne({ imagePath: temp }, async (err, productsData) => {
      try {
        if (err) {
          console.log(err);
          return;
        }
        if (productsData.Owner != temp_User.Name) {
          if (productsData.price < temp_User.Money) {
            console.log("dealing");
            var Updated_User = await Schema.user.findOne({ email: User_data.loginEmail });
            var Updated_product = await Schema.products.findOne({ imagePath: temp });
            Updated_User.Money = temp_User.Money - Updated_product.price;
            Updated_product.Owner = temp_User.Name;

            await Updated_User.save();
            await Updated_product.save();
            console.log("done: ", Updated_product);
            res.redirect('/shop');
          } else {
            res.render('shop/item', { data: productsData,money:  temp_User.Money, error: "Not Enough Money!!" });
          }

        } else {
          res.render('shop/item', { data: productsData,money:  temp_User.Money, error: "You are the Owner!" });
        }


        //return
      } catch (error) {
        console.log(error);
        return;
      }


    });
  });
});



router.get('/itempage', async (req, res, next) => {


  mongoose.model('products').findOne({ imagePath: temp }).exec((err, productsData) => {

    if (err) {
      console.log(err);
      return;
    }

    //return
    mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      } else {

        res.render('shop/item', { money: Users_Result.Money, data: productsData, error: null });
      }
    });





  });










});








router.get('/user', async (req, res, next) => {
  let user = Schema.user;
  let usersResult = await user.findOne({ email: User_data.loginEmail }).exec((err, userData) => {
    mongoose.model('user').find({ email: User_data.loginEmail }, function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      } 
      else {

        mongoose.model('products').find({ Owner: Users_Result[0].Name }, function (err, Result) {
          if (err) {
            console.log(err)
            return;
          }
          else {
            mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
              if (err) {
                console.log(err);
                return;
              } else {
                res.render('user/profile', { money: Users_Result.Money, data: Users_Result, data2: Result, check: true });
              }
            });
          }
        });
      }
    });


  });
});



router.post('/admin/user', async (req, res, next) => {
  console.log(req.body.email)
  let usersResult = await user.findOne({ email: req.body.email }).exec((err, userData) => {
    mongoose.model('user').findOne({ email: userData.email }, function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      }
      else {

        mongoose.model('products').find({ Owner: Users_Result.Name }, function (err, Result) {
          if (err) {
            console.log(err)
            return;
          }
          else {
            mongoose.model('user').findOne({ email: req.body.email }, function (err, User_Result) {
              if (err) {
                console.log(err);
                return;
              } else {
                console.log(User_Result)
                res.render('user/profile', { layout:"adminlayout",money: User_Result.Money, data: Users_Result, data2: Result });
              }
            });
          }
        });
      }
    });


  });




})



router.get("/user/setting", async (req, res) => {
  //res.render('home')
  let imageresult = await imageModel.find({}).exec(function (err, data) {
    if (err) throw err;

    console.log("image is loading");
    console.log(data);
    
    res.render('user/usersetting', { records: data })
  })
});


router.post("/user/setting", async (req, res) => {
  console.log("request has been sent");
  console.log(req.file);
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.end("Something went wrong");
    } else {
      if(req.file!= null){
        console.log(req.file.path);
      var imageName = req.file.filename;

      var imageDetails = new imageModel({
        imagename: imageName,

      });

      imageDetails.save(function (err, doc) {
        if (err) throw err;

        console.log("Image Saved");

        imageModel.find({}).exec(function (err, data) {
          if (err) throw err;

          
          var Updated_User = Schema.user.findOneAndUpdate({ email: User_data.loginEmail }, { $set: { UserIMG: req.file.filename } }, async (err, Result) => {
            if (err) throw err;

            console.log(Updated_User)
          });
          res.render('user/usersetting', { money:User_data.Money,records: data, success: true });
        })
      });
      }else{
        res.render('user/usersetting', { money:User_data.Money,result: true });
      }
      }
  });
});

router.post("/admin/listalluser", async (req, res) => {

  mongoose.model('user').find({}, function (err, Users_Result) {
    console.log(Users_Result)

    // res.render('user/adminlistalluser', { success: true, layout: 'adminlayout' })
    res.render('user/adminlistalluser', { records: Users_Result, success: true, layout: 'adminlayout' })

  });
});



  router.post("/admin/resetpassword", async (req, res) => {

    console.log(req.body.email)
  
    mongoose.model('user').findOne({ email: req.body.email }, function (err, Users_Result) {
  
      if (err) {
        console.log(err);
        return res.redirect('/admin/resetpassword');
      } else {
        console.log(Users_Result)
        if (Users_Result == null) {
          console.log("User not found")
          res.render('user/adminresetpassword', { layout: 'adminlayout', error: "User not found" });
        }
  
      }
    })
  
  })

  
  router.post('/user/Author', async (req, res, next) => {
    console.log(req.body.name)
    let usersResult = await user.findOne({ Name: req.body.name }).exec((err, userData) => {
      console.log(userData)
      mongoose.model('user').findOne({ email: userData.email }, function (err, Users_Result) {
        if (err) {
          console.log(err);
          return;
        }
        else {
  
          mongoose.model('products').find({ Owner: Users_Result.Name }, function (err, Result) {
            if (err) {
              console.log(err)
              return;
            }
            else {
              mongoose.model('user').findOne({ Name: req.body.name }, function (err, User_Result) {
                if (err) {
                  console.log(err);
                  return;
                } else {
                  console.log(User_Result)
                  mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, result) {
                    if (result.Name == req.body.name) {
                      res.render('user/profile', { money: result.Money, data: Users_Result, data2: Result, check: true });
                    }
                    else {
                      res.render('user/profile', { money: result.Money, data: Users_Result, data2: Result });
                    }
                  })
                }
              });
            }
          });
        }
      });
  
  
    });
  
  
  
  
  
  })
  
  
  
  router.post('/user/Owner', async (req, res, next) => {
    console.log(req.body.name)
    let usersResult = await user.findOne({ Name: req.body.name }).exec((err, userData) => {
      mongoose.model('user').findOne({ email: userData.email }, function (err, Users_Result) {
        if (err) {
          console.log(err);
          return;
        }
        else {
  
          mongoose.model('products').find({ Owner: Users_Result.Name }, function (err, Result) {
            if (err) {
              console.log(err)
              return;
            }
            else {
              mongoose.model('user').findOne({ Name: req.body.name }, function (err, User_Result) {
                if (err) {
                  console.log(err);
                  return;
                } else {
                  console.log(User_Result)
                  mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, result) {
  
                    if (result.Name == req.body.name) {
  
                      res.render('user/profile', { money: result.Money, data: Users_Result, data2: Result, check: true });
                    }
                    else {
                      res.render('user/profile', { money: result.Money, data: Users_Result, data2: Result });
                    }
                  })
                }
              });
            }
          });
        }
      });
  
  
    });
  
  
  
  
  })

//change PW

router.get("/user/changepw",async(req,res)=>{
  mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
    if (err) {
      console.log(err);
      return;
    }
    else {
      console.log(Users_Result.Money);
  res.render('user/PWsetting',{money:Users_Result.Money});
    }
  });
});




router.get("/uploadItem",function(req,res){
  mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
    if (err) {
      console.log(err);
      return;
    }
    else {
      console.log(Users_Result.Money);
  res.render('shop/uploadItem',{money:Users_Result.Money});
    }
});
});






router.post("/uploadItem",async(req,res)=>{

console.log("check",req.body);


upload(req, res, function (err) {
  if (err) {
    console.log(err);
    return res.end("Something went wrong");
  } else {
    if(req.file!= null){
      console.log(req.file.path);
    var imageName = req.file.filename;

    var imageDetails = new imageModel({
      imagename: imageName,
    });

    imageDetails.save(function (err, doc) {
      if (err) throw err;

      console.log("Image Saved");

      imageModel.find({}).exec(function (err, data) {
        if (err) throw err;
   
        
        res.render('shop/uploadItem', { img:req.file.filename,success: true });
      })
    });
    }else{
      res.render('shop/uploadItem', { result: true });
    }
    }
});
});









router.post("/confirmed",function(req,res){
  
  console.log("show",req.body);
  console.log("showd",typeof(req.body.item));
  
  if(req.body.item==null||req.body.title=='' || req.body.description==''||req.body.price==''){
     res.render("shop/uploadItem",{error:"Please filled every blocks!"});
  }else{
    mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      } 
      else {

    var Updated_product = new Schema.products;
    Updated_product.title = req.body.title;
    Updated_product.description = req.body.description;
    Updated_product.price = req.body.price;
    Updated_product.Owner = Users_Result.Name;
    Updated_product.Author = Users_Result.Name;
    Updated_product.imagePath = req.body.item;
    console.log("check",Updated_product);
    Updated_product.save();
    res.redirect('/shop');
  }

});
  }
});

  











router.post('/dailymission/:money/:product', async (req, res, next) => {
  let user = Schema.user;
  let usersResult = await user.findOne({ email: User_data.loginEmail }).exec((err, userData) => {
    mongoose.model('user').findOneAndUpdate({ email: User_data.loginEmail }, {"$set": {Money: parseInt(req.params['money']), uploaded_product: parseInt(req.params['product'])}} ,function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      }
      else {
        res.render('mission', {result: Users_Result})
        console.log(Users_Result);
      }
    });
  });
})

// made by patrick
router.get('/mission', async (req, res, next) => {
  let user = Schema.user;
  let usersResult = await user.findOne({ email: User_data.loginEmail }).exec((err, userData) => {
    mongoose.model('user').findOne({ email: User_data.loginEmail }, function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      }
      else {
        res.render('mission', {result: Users_Result, product: Users_Result.uploaded_product});
      }
    });
  });
});

//made by patrick
router.post('/postmission/:money', async (req, res, next) => {
  console.log("sdjfbisdbfjsd");
  let user = Schema.user;
  let usersResult = await user.find({ email: User_data.loginEmail }).exec((err, userData) => {
    mongoose.model('user').findOne({ email: User_data.loginEmail },async (err, Users_Result) =>{
      if (err) {
        console.log(err);
        return;
      }
      else {
        var Updated_User = new Schema.user(Users_Result);
        Updated_User.Money=parseInt(req.params['money']);
        Updated_User.save();
        res.render('shop/shop', { money: Users_Result.Money});
        console.log("2,",Updated_User);
      }
    });
  });

})



router.post("/user/changepw",async(req,res)=>{

  mongoose.model('user').findOne({ email: User_data.loginEmail }, async (err, Users_Result)=> {
    if (err) {
      console.log(err);
      return;
    }
    else {
      if(req.body.OldPassword==''||req.body.NewPassword==''||req.body.Conpassword==''){
        res.render('user/PWsetting',{money:Users_Result.Money,error:"Please fill all the blanks"});
      }

      var checkPW = await bcrypt.compare(req.body.OldPassword, Users_Result.password);
      console.log("checkPW",checkPW);
      if(checkPW||Users_Result.password == req.body.OldPassword){
        const result = passwordSchema.validate(req.body);
        console.log(result);
        if(result.error){
          res.render('user/PWsetting',{money:Users_Result.Money,error:"Please Set A Password with length 5"});
        }else{
          if(req.body.NewPassword==req.body.Conpassword){
            var Updated_User = await Schema.user.findOne({ email: User_data.loginEmail });
            const salt = await bcrypt.genSalt(9);

            const hash = await bcrypt.hash(req.body.NewPassword, salt);

            Updated_User.password=hash;
            console.log("changed pw",Updated_User);
            Updated_User.save();
            res.render('user/PWsetting',{money:Users_Result.Money,error:"Done!!"});
        }else{
          res.render('user/PWsetting',{money:Users_Result.Money,error:"Confirm Password is incorrect!"});
        }

      

        }
        
      }else
      res.render('user/PWsetting',{money:Users_Result.Money,error:"WrongPW!!"});
    }
  });
});











module.exports = router;
