import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    const message = "Everything is Ok and working fine";
    return res
        .status(200)
        .json(new ApiResponse(200, message, "Everything is working fine"));
});

export { healthcheck };
