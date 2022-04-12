var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var Schema = require('../models/schemas.js');
const Joi = require('@hapi/joi');
const randomstring = require('randomstring');
const bcrypt = require('bcryptjs');
global.User_data = {};
const mailer = require('../misc/mailer')

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  userName: Joi.string().required(),
  password: Joi.string().regex(/^[a-zA-Z0-9]{5,15}$/).required(),
  Conpassword: Joi.any().valid(Joi.ref('password')).required()

});



router.get('/verify', function (req, res, next) {

  console.log(User_data);
  res.render('user/verify', { layout: 'login', data: User_data });


});



router.post('/verify', async (req, res, next) => {

  const { secretToken } = req.body;
  mongoose.model('user').find({ email: User_data.email }, async (err, Users_Result) => {

    console.log('userseach', Users_Result);
    console.log('userseach.secretToken', Users_Result[0].secretToken);
    console.log('secretToken', secretToken);
    if (Users_Result[0].secretToken != secretToken) {
      res.render('user/verify', { layout: 'login', data: User_data, error: "wrong token" });
    }
    else {
      var updatedUser = await Schema.user.findOne({ email: User_data.email });
      updatedUser.isVerified = true;
      updatedUser.secretToken = null;
      await updatedUser.save();
      res.redirect('/users/login');
    }
  });

});








router.post('/login', function (req, res, next) {

  mongoose.model('user').findOne({ email: req.body.email }, async (err, Users_Result) => {
    if (err) {
      console.log(err);
      return res.redirect('/login');
    } else {
      console.log(Users_Result);

      //check email
      if (Users_Result == null) {
        res.render('user/login', { layout: 'login', error: "email is not registered" });
      }
      else {
        var checkPW = await bcrypt.compare(req.body.password, Users_Result.password);
        console.log(checkPW);

        //Check pw
        if (Users_Result.password != req.body.password && checkPW == false) {
          res.render('user/login', { layout: 'login', error: "not correct password" });
        } else {

          //check verifyied?
          if (Users_Result.isVerified != true) {
            res.render('user/login', { layout: 'login', error: "Please verfy your account" });
          } else {
            module.exports.loginEmail = req.body.email;

            res.redirect('/shop');
          }
        }
      }
    }
  });
});

//finish every wrong situation
router.get('/signup', function (req, res) {
  res.render('user/signup');
});

router.post('/signup', async (req, res, next) => {
  try {
    console.log('req.body', req.body);
    const result = userSchema.validate(req.body,);
    if (result.error) {
      console.log('result', result.error.details[0].message);
      res.render('user/signup', { layout: 'login', error: "Wrong Data input" });

    } else {


      mongoose.model('user').find({ email: req.body.email }, async (err, Users_Result) => {
        if (Users_Result.length > 2) {
          console.log(Users_Result[0].Name);
          res.render('user/signup', { layout: 'login', error: "email used" });
        }
        else {
          const hash = await Schema.hashPassword(result.value.password);

          const secretToken = randomstring.generate();
          result.value.secretToken = secretToken;
          delete result.value.Conpassword;
          result.value.password = hash;
          result.value.Name = result.value.userName;
          result.value.Money = 1000;
          result.value.No_product = 0;
          result.value.uploaded_product = 0;
          result.value.UserIMG = "defaultuser.png";




          const newUser = await new Schema.user(result.value);

          console.log(newUser);
          await newUser.save();

          const html = `Hi there,<br/> Please verify <br/> Token: <b>${secretToken}</b>`;

          await mailer.sendEmail('1155137891@link.cuhk.edu.hk', result.value.email, 'Please verify your email!', html);


          global.User_data = result.value;
          console.log('global: ', global.User_data);
          return res.redirect('/users/verify');
        }

      });



    }
  }
  catch (error) {
    console.log(error);
    next(error);
  }


});




router.get('/login', function (req, res, next) {

  res.render('user/login');
});




// admin login page routing
router.get('/adminlogin', function (req, res, next) {
  console.log("users/adminlogin   is received")

  res.render('user/adminlogin', { layout: 'login' }) //render the file  => user/adminlogin.hbs
})



//when admin login page is making request
router.post('/admin/login', function (req, res, next) {
  console.log("users/admin/login      is received")
  mongoose.model('admin').findOne({ email: req.body.email }, async (err, admin_Result) => {
    if (err) {
      console.log(err);
      return res.redirect('/adminlogin', { layout: 'login' }); // redirect to the admin login page if the error occurs
    } else {
      console.log(admin_Result); // checkout the result of searching database ,if the email can not found in the database ,then the result is null otherwise there should be a result and it is an object

      //check email
      if (admin_Result == null) { // result is null which means the email is not found 
        res.render('user/adminlogin', { layout: 'login', error: "email is not registered" });
      }
      else {
        console.log(admin_Result.email)
        if (admin_Result.email == "admin") {
          var checkPW = await bcrypt.compare(req.body.password, admin_Result.password);
          console.log(checkPW);
          if (checkPW) {
            res.render('user/admin', { layout: 'adminlayout' }) //render the file=>user/admin if the password is right and the admin is found and correct in the database
          } else {

            res.render('user/adminlogin', { layout: 'login', error: "incorrect password" }); //render the admin login page if the password is wrong
          }
        } else {
          res.render('user/adminlogin', { layout: 'login', error: "invaild authization" }); // it is a user not admin
        }
      }

    }
  })
})



router.get('/admin/resetpassword', function (req, res, next) {

  res.render('user/adminresetpassword', { layout: 'adminlayout' });
});

router.get('/admin/listalluser', function (req, res, next) {

  res.render('user/adminlistalluser', { layout: 'adminlayout' });
});



module.exports = router;

