import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { validateObjectId } from "../utils/validateObjectId.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    let skip = (page - 1) * limit;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    // const video = await Video.findById(videoId);
    // if (!video) {
    //     throw new ApiError(400, "Invalid videoId");
    // }
    const totalComments = await Comment.countDocuments({ video: videoId });

    // Calculate total pages
    const totalPages = Math.ceil(totalComments / limit);
    // const comments = await Comment.findById(videoId);
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user",
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
                    $first: "$user",
                },
            },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $project: {
                userDetails: 1,
                content: 1,
                createdAt: 1,
                // skip:1,
            },
        },
    ]);
    const data = {
        comments,
        pagination: {
            skip,
            limit: parseInt(limit),
            currentPage: parseInt(page),
            totalPages,
        },
    };
    res.status(200).json(
        new ApiResponse(200, data, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId) {
        throw new ApiError(400, "Invalid video id");
    }
    if (!content) {
        throw new ApiError(400, "Comment is required");
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    const addComment = await Comment.create({
        video: videoId,
        content,
        owner: req.user?._id,
    });
    if (!addComment) {
        throw new ApiError(500, "Error while adding comment try again");
    }
    res.status(200).json(
        new ApiResponse(200, addComment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    validateObjectId(commentId, "commentId");

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "No comment found");
    }

    checkOwnership(comment, req.user?._id, "update comment");

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        },
        { new: true } // to return new document instead of old
    );

    return res
        .status(201)
        .json(
            new ApiResponse(201, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    validateObjectId(commentId, "commentId");

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "No comment found");
    }
    checkOwnership(comment, req.user?._id, "delete this comment");
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedComment, "Comment deleted successfully")
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
