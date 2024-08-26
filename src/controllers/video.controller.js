import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { DB_NAME } from "../constants.js";
import mongoose, { connect, isValidObjectId } from "mongoose";
import { validateObjectId } from "../utils/validateObjectId.js";
import { checkOwnership } from "../utils/checkOwnerShip.js";

// Mutation
const uploadVideo = asyncHandler(async (req, res) => {
    let { description, title, duration, isPublished } = req.body;
    const files = req?.files;
    const videoFileLocalPath = files?.videoFile[0]?.path;
    const thumbnailLocalPath = files?.thumbnail[0]?.path;
    if (!description || !title) {
        throw new ApiError(
            400,
            `${description || title || duration} are required`
        );
    }
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    duration = videoFile?.duration;
    console.log("videoFile", videoFile);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!videoFile || !thumbnail) {
        throw new ApiError(500, "Error while uploading files to cloudinary");
    }

    const video = await Video.create({
        title,
        description,
        duration,
        videoFile: {
            url: videoFile?.url,
            public_id: videoFile?.public_id,
        },
        thumbnail: {
            url: thumbnail?.url,
            public_id: thumbnail?.public_id,
        },
        isPublished: false,
        owner: req.user._id,
    });

    // You can add more logging or processing here if needed

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    validateObjectId(videoId, "videoId");

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "No video Found");
    }

    checkOwnership(video, req.user?._id, "update this video");

    const thumbnailToDelete = video.thumbnail?._id;
    const thumbnailLocalPath = req.file.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "No thumbnail selected");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    url: thumbnail?.url,
                    public_id: thumbnail.public_id,
                },
            },
        },
        { new: true }
    );
    if (!updatedVideo) {
        throw new ApiError(
            500,
            "Server Error while updated the video please try again"
        );
    }
    // if (updatedVideo) {
    //     await deleteOnCloudinary(thumbnailToDelete);
    // }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    validateObjectId(videoId, "videoId");

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    checkOwnership(video, req.user?._id, "delete video");

    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if (!deleteVideo) {
        throw new ApiError(500, "Error while deleting video please try again");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, deleteVideo, "Video deleted successfully"));
});

// Get video(s)
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // 1- Match the Video by ID:
    // 2-

    await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } }, // Increment the 'views' field by 1
        { new: true } // Return the updated document
    );

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        // Comments lookup
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments",
                pipeline: [
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
                            user: { $first: "$user" },
                        },
                    },
                    {
                        $project: {
                            content: 1,
                            createdAt: 1,
                            user: 1,
                        },
                    },
                ],
            },
        },
        // Owner/User of this video lookup
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers",
                        },
                    },

                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers",
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user._id,
                                            "$subscribers.subscriber",
                                        ],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            isSubscribed: 1,
                            subscribersCount: 1,
                        },
                    },
                ],
            },
        },
        // Like on this video lookup
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        // Send data of ownerDetails as an {object} as by default it sends [array]
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                ownerDetails: { $first: "$ownerDetails" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                ownerDetails: 1,
                likesCount: 1,
                isLiked: 1,
            },
        },
    ]);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;
    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;

    const pipeline = [];

    // Search Stage
    if (query) {
        pipeline.push({
            // $match: {
            //     $or: [
            //         { title: { $regex: query, $options: "i" } },
            //         { description: { $regex: query, $options: "i" } },
            //     ],
            // },
            $match: {
                $text: { $search: query },
            },
        });
    }

    // Match isPublished
    pipeline.push({ $match: { isPublished: true } });

    // Sort Stage
    pipeline.push({ $sort: sort });

    // Lookups
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
                ownerDetails: { $first: "$ownerDetails" },
            },
        }
    );

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    validateObjectId(videoId, "videoId");
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    checkOwnership(video, req.user?._id, "toggle video status");

    const toggledVideoPublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished,
            },
        },
        { new: true }
    );

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toggle video publish status");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                toggledVideoPublish,
                "Video published status updated successfully"
            )
        );
});

export {
    uploadVideo,
    getVideoById,
    getAllVideos,
    deleteVideo,
    updateVideo,
    togglePublishStatus,
};
