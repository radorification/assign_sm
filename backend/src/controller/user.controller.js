import {asyncHandler} from "../utils/asyncHandler.js"
//import

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
        intrests,
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



export default registerUser;