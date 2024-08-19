import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { subscriberId, channelId } = req.body;
    if (!subscriberId || !channelId) {
        throw new ApiError(400, "Subscriber ID and Channel ID are required");
    }

    try {
        // Check for an existing subscription
        const existingSubscription = await Subscription.findOne({
            subscriber: subscriberId,
            channel: channelId,
        });

        if (existingSubscription) {
            // Unsubscribe if already subscribed
            await Subscription.deleteOne({
                subscriber: subscriberId,
                channel: channelId,
            });
            return res
                .status(200)
                .json(new ApiResponse(200, null, "Unsubscribed successfully"));
        } else {
            // Subscribe if not already subscribed
            const subscription = new Subscription({
                subscriber: subscriberId,
                channel: channelId,
            });
            await subscription.save();
            return res
                .status(201)
                .json(
                    new ApiResponse(
                        201,
                        subscription,
                        "Subscribed successfully"
                    )
                );
        }
    } catch (error) {
        throw new ApiError(500, error.message || "Server error");
    }
});

export { toggleSubscription };
