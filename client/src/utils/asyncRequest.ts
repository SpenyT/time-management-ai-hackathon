import axios from "axios";

import type { PostResponse } from "@/types/apiResponses";

/**
 * Fetch a sample post from a test API
 */
export async function fetchPost(
  postId: number = 1
): Promise<PostResponse> {
  const response = await axios.get<PostResponse>(
    `https://jsonplaceholder.typicode.com/posts/${postId}`
  );

  return response.data;
}