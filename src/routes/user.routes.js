import { Router } from "express";
import {
    changeCurrentPassword,
    getAllUsers,
    getCurrentUser,
    getUserChannelProfile,
    getUserDetail,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateUserProfileDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);
// Auth
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);

// refresh token
router.route("/refresh-token").post(refreshAccessToken);
// Get User Details
router.route("/users-list").get(getAllUsers);
// router.route("/user/:id").get(getUserDetail);
router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/watch-history").get(verifyJWT, getWatchHistory);
// Mutation
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-account").patch(verifyJWT, updateUserProfileDetails);
router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/cover-image")
    .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

//secured routes

router
    .route("/channel-details/:username")
    .get(verifyJWT, getUserChannelProfile);

export default router;
