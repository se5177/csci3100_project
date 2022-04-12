var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const { route, head } = require('../app.js');
var Schema = require('../models/schemas.js');
var User_data = require('./users');

/* GET home page. */
router.get('/shop', async (req, res, next) => {
  let products = Schema.products;
  let productsResult = await products.find({}).exec((err, productsData) => {
    console.log(productsData);
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
        }
        else {
          res.render('shop/shop', { money: Users_Result.Money, data: productsData });
        }
      });
    }
  });
});

// made by patrick
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
  let user = Schema.user;
  let usersResult = await user.find({ email: User_data.loginEmail }).exec((err, userData) => {
    mongoose.model('user').findOneAndUpdate({ email: User_data.loginEmail }, {$set: {Money: parseInt(req.params['money'])}} ,function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      }
      else {
        res.render('/partials/header', {money : Users_Result.Money})
        console.log(Users_Result);
      }
    });
  });
})


router.get('/itempage', async (req, res, next) => {
  res.render('shop/item', { data: "abc" });
});


router.get('/user', async (req, res, next) => {

  let user = Schema.user;
  let usersResult = await user.find({ email: User_data.loginEmail }).exec((err, userData) => {
    mongoose.model('user').find({ email: User_data.loginEmail }, function (err, Users_Result) {
      if (err) {
        console.log(err);
        return;
      }
      else {
        console.log(Users_Result);
        mongoose.model('products').find({ Owner: Users_Result[0].Name }, function (err, Result) {
          if (err) {
            console.log(err)
            return;
          }
          else {
            console.log(Result);
            res.render('user/profile', { data: Users_Result, data2: Result });
          }
        });
      }


    });


  });
});

module.exports = router;
