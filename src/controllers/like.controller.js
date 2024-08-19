import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

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
    //TODO: toggle like on comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

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
                    "Unlike Comment Successfull"
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
    //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
