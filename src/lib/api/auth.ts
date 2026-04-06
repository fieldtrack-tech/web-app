import { apiGet } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import { ApiError } from "@/types";

export interface AuthMeResponse {
  id: string;
  email: string;
  role: string;
  orgId: string;
}

export const authApi = {
  /**
   * Fetch the caller's identity from the backend.
   * Returns null when the endpoint is not yet implemented (404/501),
   * so this is always safe to call regardless of backend version.
   */
  me: async (): Promise<AuthMeResponse | null> => {
    try {
      return await apiGet<AuthMeResponse>(API.authMe);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
        return null;
      }
      throw err;
    }
  },
};
