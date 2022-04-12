var mongoose = require('mongoose');
var Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;
const bcrypt = require('bcryptjs');


var ProductSchema = new Schema({
    imagePath:{type: String, required: true},
    title: {type: String, required: true},
    Author:{type: String, required: true},
    Owner:{type: String, required: true},
    description:{type: String, required: true},
    price:{type: Number,required: true}

});
var UserSchema = new Schema({
    Name:{type: String, required: true},
    isVerified: { type: Boolean, default: false },
    email:{type: String,unique:true,lowercase:true, required: true},
    password:{type:String, required:true},
    UserIMG:{type: String, required: true},
    No_product:{type: Number, required: true},
    uploaded_product:{type: Number, required: true},
    Money:{type: Number, required: true},
    secretToken:String

});
var tokenSchema = new Schema({
    _userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    expireAt: { type: Date, default: Date.now, index: { expires: 86400000 } }
});

let products = mongoose.model('products',ProductSchema,'products');
let users = mongoose.model('user',UserSchema,'user');
let DBSchema = {'products':products,'user':users};
module.exports = DBSchema;

module.exports.hashPassword = async (password) =>{
    try{
        const salt = await bcrypt.genSalt(9);

        return await bcrypt.hash(password, salt);
    }catch(error){
         throw new Error('Hashing failed',error);
         return;
    }
}

