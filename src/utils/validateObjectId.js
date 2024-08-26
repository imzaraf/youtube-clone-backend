import { isValidObjectId } from "mongoose";
import { ApiError } from "./ApiError.js";

export const validateObjectId = (id, resourceName = "Resource") => {
    if (!isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${resourceName} ID`);
    }
};
