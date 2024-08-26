import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectId } from "../utils/validateObjectId.js";
import { Video } from "../models/video.model.js";
import { checkOwnership } from "../utils/checkOwnerShip.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name && !description) {
        throw new ApiError(400, `${name} and ${description} is required`);
    }
    const playlistCreated = await Playlist.create({
        name,
        description,
        owner: req?.user?._id,
    });
    if (!playlistCreated) {
        throw new ApiError(
            500,
            "Error while creating playlist please try again"
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                playlistCreated,
                "Playlist successfully created"
            )
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req?.query;
    let skip = (page - 1) * limit;

    validateObjectId(userId, "userId");
    const totalPlayLists = await Playlist.countDocuments({ owner: userId });
    const totalPages = Math.ceil(totalPlayLists / limit);

    const userPlayLists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req?.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "userPlayList",
                pipeline: [
                    {
                        $project: {
                            videoFile: {
                                url: 1,
                            },
                            thumbnail: {
                                url: 1,
                            },
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            owner: 1,
                        },
                    },
                ],
            },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
    ]);

    const data = {
        userPlayLists,
        pagination: {
            skip,
            limit: parseInt(limit),
            currentPage: parseInt(page),
            totalPages,
        },
    };

    return res
        .status(200)
        .json(
            new ApiResponse(200, data, "User playlists fetched successfully")
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { page = 1, limit = 10 } = req?.query;
    let skip = (page - 1) * limit;
    validateObjectId(playlistId, "playlistId");
    const totalPlaylistVideos = await Playlist.countDocuments({
        owner: req.user?._id,
    });
    const totalPages = Math.ceil(totalPlaylistVideos / limit);
    const userPlayList = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "userPlayList",
                pipeline: [
                    {
                        $project: {
                            videoFile: {
                                url: 1,
                            },
                            thumbnail: {
                                url: 1,
                            },
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            owner: 1,
                        },
                    },
                ],
            },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
    ]);

    const data = {
        data: userPlayList[0],
        pagination: {
            skip,
            limit: parseInt(limit),
            currentPage: parseInt(page),
            totalPages,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, data, "User playlist successfully fetched"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // validateObjectId(playlistId, "playlistId");
    // validateObjectId(videoId, "videoId");

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    checkOwnership(video, req.user?._id, "add video to playlist");

    const addToPlayList = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, // Use $addToSet to avoid duplicates
        { new: true } // Return the updated document
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                addToPlayList,
                "Video added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    validateObjectId(playlistId, "playlistId");
    validateObjectId(videoId, "videoId");

    const videoRemoved = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId },
        },
        { new: true }
    );

    if (!videoRemoved) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoRemoved, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    validateObjectId(playlistId, "playlistId");

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId);

    if (!playlistDeleted) {
        throw new ApiError(
            500,
            "Error while deleting playlist please try again"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistDeleted,
                "Playlist deleted successfully"
            )
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    validateObjectId(playlistId, "playlistId");
    if (!(name || description)) {
        throw new ApiError(400, `${name} ${description} is required`);
    }

    const playlistUpdated = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { name, description } },
        { new: true }
    );
    if (!playlistUpdated) {
        throw new ApiError(
            500,
            "Error while updating playlist please try again"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistUpdated,
                "Playlist successfully updated"
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
