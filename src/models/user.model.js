import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		fullName: { type: String, trim: true, required: true, index: true },
		avatar: {
			type: String, // Cloudinary where we can store images/files/videos
			required: true,
		},
		coverImage: {
			type: String,
		},
		watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		refreshToken: {
			type: String,
		},
	},
	{ timestamps: true }
);

// password hashed
userSchema.pre("save", async function (next) {
	// don't use arrow function here because
	// arrow function doesn't have this reference,
	// doesn't have context so that why using function
	// as save event is running on user so it have access to user to manipulate values

	// first check if password is modified then save it
	if (this.isModified("password")) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next(); // pass to next function
});

// confirm or comparing both the entered and hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password);
};

// token
userSchema.methods.generateAccessToken = async function () {
	return jwt.sign(
		{ id: this._id, username: this.username, fullName: this.fullName },
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
	);
};
userSchema.methods.generateRefreshToken = async function () {
	return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
	});
};

export const User = mongoose.model("User", userSchema);
