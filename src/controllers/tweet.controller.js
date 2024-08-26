import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { checkOwnership } from "../utils/checkOwnerShip.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const tweetCreated = await Tweet.create({
        content,
        owner: req.user?._id,
    });
    if (!tweetCreated) {
        throw new ApiError(500, "Error while posting tweet please try again");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, tweetCreated, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    let skip = (page - 1) * limit;
    const { userId } = req.params;
    validateObjectId(userId, "userId");

    const totalTweets = await Tweet.countDocuments({ owner: userId });
    const totalPages = Math.ceil(totalTweets / limit);
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                userDetails: {
                    $first: "$userDetails",
                },
            },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
            },
        },
    ]);
    const data = {
        tweets,
        pagination: {
            skip,
            limit: parseInt(limit),
            currentPage: parseInt(page),
            totalPages,
        },
    };
    return res
        .status(200)
        .json(new ApiResponse(200, data, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    validateObjectId(tweetId, "tweetId");
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(400, "Not valid tweetId");
    }

    checkOwnership(tweet, req.user?._id, "update this tweet");
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        content,
    });
    if (!updatedTweet) {
        throw new ApiError(500, "Error while updating tweet please try again");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    validateObjectId(tweetId, "tweetId");
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Not found");
    }
    checkOwnership(tweet, req.user?._id, "delete this tweet");

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(500, "Error while deleting tweet please try again");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
