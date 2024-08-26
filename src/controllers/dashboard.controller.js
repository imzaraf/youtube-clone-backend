import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelStats = await Video.aggregate([
        // {
        //     $match: {
        //         owner: new mongoose.Types.ObjectId(req.user?._id),
        //     },
        // },
        {
            $group: {
                _id: "$owner",
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
            },
        },
    ]);
    const likes = await Like.aggregate([
        {
            $group: {
                _id: "$video",
                likes: { $sum: 1 },
            },
        },
    ]);
    const subscriberStats = await Subscription.aggregate([
        // {
        //     $match: {
        //         channel: new mongoose.Types.ObjectId(req.user?._id),
        //     },
        // },
        {
            $group: {
                _id: "$channel",
                totalSubscribers: { $sum: 1 },
            },
        },
    ]);

    const stats = {
        totalLikes: likes[0]?.likes,
        totalViews: channelStats[0]?.totalViews ?? 0,
        totalVideos: channelStats[0]?.totalVideos ?? 0,
        totalSubscribers: subscriberStats[0]?.totalSubscribers ?? 0,
    };
    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelVideos,
                "Channel videos fetched successfully"
            )
        );
});

export { getChannelStats, getChannelVideos };
