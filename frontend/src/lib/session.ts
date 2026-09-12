import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { MessageResponse, User } from "@/lib/types";

export const sessionKey = ["session"] as const;

export function useSession() {
  return useQuery<User | null>({
    queryKey: sessionKey,
    queryFn: () => apiGet<User | null>("/auth/session"),
    retry: false,
    staleTime: 30_000,
  });
}

export async function beginSession() {
  await queryClient.invalidateQueries({ queryKey: sessionKey });
}

export async function endSession() {
  await apiPost<MessageResponse>("/auth/logout");
  queryClient.clear();
  await queryClient.invalidateQueries({ queryKey: sessionKey });
}
