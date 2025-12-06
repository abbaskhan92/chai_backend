import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend/Postmain
    // validation - not empty
    // check if user already exists ? (username, email)
    // check for images, avatar (required)
    // upload them to cloudinary, avatar
    // create user object - create entry in database
    // remove password and refresh token field from response
    // check for user creation
    // return response
    const {email, fullName, username, password} = req.body;
    console.log(`Full name: ${fullName} \nPassword: ${password}`);

    //beginer level but its pkay
    // if (fullName ==="") {
    //     throw new ApiError(400, "fullName is required")
    // }
    
    if(
        [email, fullName, username, password].some((field) => 
        field?.trim === "")
    ) {
        throw new ApiError(400, 'All fields are required') 
      }

    const existedUser = User.findOne({
        $or:[{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage[0].path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //these fields are not required ... bydefault all selected, those not needed, write - before that field to hide
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    };

    res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    );

})


export {registerUser}