import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/Cloudinary.js"
import {User} from "../models/user.models.js"

const generateAccessTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}
    } catch (error) {
        console.error(401, "Something went wrong");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    try {
        const {name, email, password} = req.body
    
        if(!name || !email || !password) throw new ApiError(401, "All fields are required");
    
        const existedUser = await User.findOne({email})
        if(existedUser) throw new ApiError(401, "User already exists");
    
        const profilePicLocalPath = req.files?.profilePic[0]?.path 
        if(!profilePicLocalPath) throw new ApiError(401, "profile pic is required");
    
        const profilePic = await uploadOnCloudinary(profilePicLocalPath)
        console.log(profilePic.url);
        
        if(!profilePic) throw new ApiError(401, "Error in uploading an pic on cloudinary");
    
        const user = await User.create({
            name,
            email,
            password,
            profilePic: profilePic.url
        })
    
        if(!user) throw new ApiError(401, "Unable to create user");
    
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {createdUser, accessToken, refreshToken},
            "User registered successfully"
        ))   
    } catch (error) {
        console.error("Failed to register user: ", error);
    }
})

const loginUser = asyncHandler(async (req, res) => {
    try {
        const {email, password} = req.body
    
        if(!email || !password) throw new ApiError(401, "All fields are required");
    
        const user = await User.findOne({email})
        if(!user) throw new ApiError(401, 'User not found');
    
        const isPasswordValid = await user.isPasswordCorrect(password)
        if(!isPasswordValid) throw new ApiError(401, "Password is incorrect");
    
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            201,
            {accessToken, refreshToken, loggedInUser},
            "User logged in successfully"
        ))
    } catch (error) {
        console.error("Failed to logged in user: ", error);
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: ""
                }
            },
            {new: true}
        )
    
        if(!user) throw new ApiError(401, "User not found");
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "User logged out successfully."
        ))
    } catch (error) {
        console.error("Failed to logged out user: ", error);
    }
})

const changePassword = asyncHandler(async (req, res) => {
    try {
        const {oldPass, newPass} = req.body

        if(!oldPass || !newPass) throw new ApiError(401, "All fields are required");

        const user = await User.findById(req.user._id)
        
        const isPassValid = await user.isPasswordCorrect(oldPass)
        if(!isPassValid) throw new ApiError(401, "Old password is incorrect");

        user.password = newPass
        await user.save()

        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {},
            "Password changed successfully."
        ))
    } catch (error) {
        console.error("Failed to change password: ", error);
    }
})

const refreshAccessToken = asyncHandler(async (req, res) => {})

const updateOnlineStatus = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {isOnline} = req.body

    const user = await User.findByIdAndUpdate(
        userId,
        {
            isOnline: isOnline
        },
        {new: true}
    ).select("-password -refreshToken")
    if(!user) throw new ApiError(401, "User not found");

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        user,
        "Online status updated"
    ))
})

const updateLastSeen = asyncHandler(async (req, res) => {
    const {userId} = req.params

    const user = await User.findByIdAndUpdate(
        userId, 
        {
            LastSeen: new Date()
        },
        {new: true}
    ).select("-password -refreshToken")
    if(!user) throw new ApiError(401, "User not found");

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        user,
        "Last seen updated"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    updateOnlineStatus,
    updateLastSeen
}