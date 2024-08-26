import { ApiError } from "./ApiError.js";

export const checkOwnership = (resource, userId, resourceName = "Resource") => {
    if (resource?.owner.toString() !== userId.toString()) {
        throw new ApiError(403, `Unauthorized to ${resourceName}`);
    }
};
