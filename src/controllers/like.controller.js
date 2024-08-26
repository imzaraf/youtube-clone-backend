import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { checkOwnership } from "../utils/checkOwnerShip.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    validateObjectId(videoId, "videoId");

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    validateObjectId(commentId, "commentId");
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    checkOwnership(comment, req.user?._id, "toggle comment like");

    const alreadyLiked = await Like.findOne({
        comment: commentId,
        user: req.user?._id,
    });

    if (alreadyLiked) {
        await alreadyLiked.findByIdAndDelete(alreadyLiked?._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLike: false },
                    "Unlike Comment Successfully"
                )
            );
    }

    await alreadyLiked.create({
        comment: commentId,
        user: req.user?._id,
    });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isLiked: true },
                "Comment Liked Successfully"
            )
        );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    validateObjectId(tweetId, "tweetId");

    const alreadyLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (alreadyLiked) {
        await Like.findByIdAndDelete(tweetId);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: false },
                    "Tweet Un-liked successfully"
                )
            );
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { isLiked: true }, "Tweet Liked Successfully")
        );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
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
        // lookup for videos
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            videoFile: {
                                url: 1,
                            },
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
                videoDetails: {
                    $first: "$videoDetails",
                },
            },
        },
        {
            $project: {
                createdAt: 1,
                updatedAt: 1,
                userDetails: 1,
                videoDetails: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked video fetched successfully"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
