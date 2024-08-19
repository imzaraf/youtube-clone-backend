// Here's a step-by-step breakdown of what to perform in the getAllVideos function using an aggregation pipeline, along with hints on what to use at each step:

// Step 1: Extract Query Parameters ✅
// Purpose: Get the parameters from the request query, such as page, limit, query, sortBy, sortType, and userId.
// Hints:
// Use req.query to access the query parameters.
// Set default values if parameters are not provided, like page = 1 and limit = 10.
// Step 2: Initialize Aggregation Pipeline ✅
// Purpose: Start building the aggregation pipeline as an empty array.
// Hints:
// Initialize an empty array pipeline = [] to hold the stages of the aggregation.
// Step 3: Full-Text Search (Optional) ✅
// Purpose: If a search query is provided, add a full-text search stage to the pipeline.
// Hints:
// Use the $search stage with text search type.
// Define the query and path (e.g., ["title", "description"]) to specify the fields to search.
// Ensure a search index is created in MongoDB Atlas for efficient text search.
// Step 4: Match by User ID (Optional) 
// Purpose: Filter videos by a specific user if a userId is provided.
// Hints:
// Use $match to filter documents where owner matches the provided userId.
// Convert userId to a mongoose.Types.ObjectId if needed.
// Validate userId using a helper function like isValidObjectId.
// Step 5: Filter Published Videos ✅
// Purpose: Ensure only published videos are retrieved.
// Hints:
// Add a $match stage to filter videos where isPublished is true.
// Step 6: Sort Videos ✅
// Purpose: Sort the videos based on the provided sorting criteria.
// Hints:
// Use $sort to define the sorting criteria.
// Sort by sortBy parameter (e.g., views, createdAt, duration).
// Determine the order with sortType (use 1 for ascending and -1 for descending).
// Step 7: Fetch Related Data (User Details) 
// Purpose: Enrich the video data with related user details.
// Hints:
// Use $lookup to join data from the users collection based on the owner field.
// Specify the fields to include from the users collection, like username and avatar.url.
// Use $unwind to flatten the array of user details (since $lookup returns an array).
// Step 8: Paginate the Results
// Purpose: Implement pagination to limit the number of results returned and handle page navigation.
// Hints:
// Use the skip and limit options within the aggregation pipeline.
// Alternatively, if using mongoose-aggregate-paginate, pass the aggregation pipeline and pagination options (page and limit) to the aggregatePaginate method.
// Step 9: Return the Response
// Purpose: Send the aggregated and paginated results back to the client.
// Hints:
// Structure the response using a standardized format like ApiResponse.
// Include the video data and pagination information in the response.
// Handle any errors gracefully and return appropriate error responses if needed.
// Final Notes:
// Error Handling: Ensure all steps include proper error handling, especially for database operations and input validation.
// Performance Considerations: Be mindful of the performance implications of using aggregation pipelines, especially with large datasets.
