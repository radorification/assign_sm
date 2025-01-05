import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshTokens = async(userId) => {
	try {
		const user = await User.findById(userId)
		const accessToken = user.generateAccessToken()
		const refreshToken = user.generateRefreshToken()

		user.refreshToken = refreshToken
		await user.save({validateBeforeSave: false})	// >validateBeforeSave< is used since we aren't validating password here while saving data in our MongoDB database.
		return {accessToken, refreshToken}

	} catch (error) {
		throw new ApiError(400, "Some error occoured while generating tokens")
	}
}

const registerUser = asyncHandler(async(req, res)=>{

    const {username, fullname, email, password} = req.body;
	 console.log(req.body);


    if([username, password, fullname, email].some((field) => field?.trim() == "")){
        throw new ApiError(400, "Username, Password, Fullname and Email fields are required!");
        
    }


	const existingUser = await User.findOne({
		$or: [{username}, {email}]
	});

	if(existingUser){
		throw new ApiError(409, "Username or E-mail already exists!")
	}


	const avatarLocalPath = req.files?.avatar?.[0]?.path;
	

	if(!avatarLocalPath){
		throw new ApiError(400, "Avatar is required");
		
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);

	if(!avatar){
		throw new ApiError(400, "Avatar is required");
	}


	const userInfo = await User.create({
		username,
		avatar: avatar?.url || "",
		email,
        // intrests (only if the user has given any)
        intrests: req.body.intrests || [],
        friends: req.body.friends || [],
		password,
		fullname
	})

	const createdUser = await User.findById(userInfo._id).select("-password -refreshToken");

	if(!createdUser){
		throw new ApiError(500, "Something went wrong while registering the User")
	}


	return res.status(201).json(
		new ApiResponse(200, createdUser, "User created successfully!")
	)
})


const loginUser = asyncHandler(async (req, res) => {

	//req.body -> data
	//check whether the login credentials matches from the database
	//throw an error if credentials don't match OR find the user which matches the credentials
	//Handle refresh tokens and access token
	//set refresh tokens of a larger duration than the access token
	

	const {username, email, password} = req.body;

	if(!(username || email)) {
		throw new ApiError(400, "Username or Email is required for logging in!")
	}

	const foundUser = await User.findOne({
		$or: [{username}, {email}]
	})

	if(!foundUser){
		throw new ApiError(404, "User does not exists!")
	}

	const isPasswordValid = await foundUser.isPasswordCorrect(password)

	if(!isPasswordValid){
		throw new ApiError(401, "Password is incorrect!")
	}

	const {accessToken, refreshToken} = await generateAccessandRefreshTokens(foundUser._id)

	const loggedInUser = await User.findById(foundUser._id).select("-password -refreshToken")

	const options = {
		httpOnly: true,
		secure: true
	}

	return res.status(200)
	.cookie("accessToken", accessToken, options)
	.cookie("refreshToken", refreshToken, options)
	.json(
		new ApiResponse(
			200,
			{
				foundUser: loggedInUser, accessToken, refreshToken
			},
			"User logged in successfully"
		)
	)
})

/* READ */
const getUser = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  };

const getUserFriends = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
  
      const friends = await Promise.all(
        user.friends.map((id) => User.findById(id))
      );
      const formattedFriends = friends.map(
        ({ _id, fullname, username, avatar }) => {
          return { _id, fullname, username, avatar };
        }
      );
      res.status(200).json(formattedFriends);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  };

  /* UPDATE */
const addRemoveFriend = async (req, res) => {
    try {
      const { id, friendId } = req.params;
      const user = await User.findById(id);
      const friend = await User.findById(friendId);
  
      if (user.friends.includes(friendId)) {
        user.friends = user.friends.filter((id) => id !== friendId);
        friend.friends = friend.friends.filter((id) => id !== id);
      } else {
        user.friends.push(friendId);
        friend.friends.push(id);
      }
      await user.save();
      await friend.save();
  
      const friends = await Promise.all(
        user.friends.map((id) => User.findById(id))
      );
      const formattedFriends = friends.map(
        ({ _id, fullname, username, avatar }) => {
          return { _id, fullname, username, avatar };
        }
      );
  
      res.status(200).json(formattedFriends);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  };

export {registerUser, loginUser, getUser, getUserFriends, addRemoveFriend};