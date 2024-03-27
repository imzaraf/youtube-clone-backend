import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
	
	const { fullName, email, username, password } = req.body;
	console.log("data", email, fullName, username);
	if (
		[fullName, email, username, password].some(
			(field) => field?.trim() === ""
		)
	) {
		throw new ApiError(400, "All Fields are required");
	}

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(400, "Username or Email Already Exists");
	}

	const avatarLocalPath = req.files?.avatar[0].path;
	const coverImageLocalPath = req.files.coverImage[0].path;

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar is required");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);
	if (!avatar) {
		throw new ApiError(400, "Avatar file is required");
	}

	const user = await User.create({
		fullName,
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
		email,
		password,
		username: username.toLowerCase(),
	});

	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);
	if (!createdUser) {
		throw new ApiError(500, "Something went wrong while registering user");
	}

	return res
		.status(201)
		.json(
			new ApiResponse(200, createdUser, "User registered successfully")
		);
    // 1- Get user details from frontend(postman)
	// 2- Validation - Not empty
	// 3- Check if user already exist: username and email
	// 4- Check for images, check for avatar
	// 5- Upload them to cloudinary, avatar
	// 6- Create user object - create entry in db
	// 7- Remove Password and Refresh token field from response
	// 8- check for user creation - null or created successfully
	// 9- return res
});

export { registerUser };
