import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema(
{

    username :{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true,
        index: true

    },
    email :{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true
    },
    fullName :{
        type: String,
        required: true,
        trim: true,
        index : true
    },
    avatar :{
        type: String,  //Cloudinary url
        required: true,
    },
    coverImage:{
        type: String, //Cloudinary url

    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true,"Password is required"]
    },
    refreshToken:{
        type: String
    }
    
},{timestamps : true})
//method 1
// userSchema.pre('save', async function(next){
//     if (this.isModified('password')) {
//         this.password = bcrypt.hash(this.password)
//         next()
//     }
// })

//method 2
userSchema.pre("save", async function(next){
    if (!this.isModified("password")) return next
    this.password = await bcrypt.hash(this.password, 10)
    next
})
// Custom method creation
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateExpiryToken = function(){
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)