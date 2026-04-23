import { useMutation, useQuery } from "@tanstack/react-query"

import {
  getAssistantSuggestions,
  queryAssistant,
  type AssistantQueryRequest,
  type AssistantQueryResponse,
} from "@/features/assistant/api/assistant.api"

export function useAssistantQuery() {
  return useMutation<AssistantQueryResponse, Error, AssistantQueryRequest>({
    mutationFn: queryAssistant,
  })
}

export function useAssistantSuggestions(context = "general") {
  return useQuery({
    queryKey: ["assistant", "suggestions", context],
    queryFn: () => getAssistantSuggestions(context),
    staleTime: 5 * 60 * 1000,
  })
}
