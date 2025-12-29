import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refersh Tokens")
    }
}

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
    //console.log(req.body); assignment
    

    //beginer level but its okay
    // if (fullName ==="") {
    //     throw new ApiError(400, "fullName is required")
    // }
    
    if(
        [email, fullName, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, 'All fields are required') 
      }

    const existedUser = await User.findOne({
        $or:[{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage?.[0]?.path; Both methods are okay
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

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
 const loginUser = asyncHandler( async (req, res) => {

//     /* Algorithm
//     1. req.body --> data
//     2. username and email check
//     3. find user
//     4. password
//     5. Access and Refresh token 
//     6. Send cookies
//     */
    const {username, email, password} = req.body

   if(! (email || username)){
    throw new ApiError(400, "username or email is required")
   }
   const user = await User.findOne(
    {
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(400, "User does not exist")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
             "User Logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
        
    )

    const options = {
    httpOnly: true,
    secure: true
}

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
 
})




export {
    registerUser,
    loginUser,
    logoutUser
}