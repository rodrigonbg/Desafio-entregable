const mongoose = require("mongoose");

//collection
const usersCollection = 'users'

//user schema
const  userSchema = new mongoose.Schema({
    first_name:{
        type:String,
        required:true
    },
    last_name:{
        type:String,
    },
    email:{
        type:String,
        index:true, //indexing the field for faster search
        unique:true
    },
    age:{
        type:Number,
    },
    password:{
        type:String,
    }
})

const UserModel = mongoose.model(usersCollection, userSchema)

module.exports = UserModel;