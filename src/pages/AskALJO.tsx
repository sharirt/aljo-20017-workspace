import { useUser, useAgentChat } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { useNavigate } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { ALJOAssistantAgentChat, LoginPage } from "@/product-types";
import { AgentChatSimple } from "@/components/ui/agent-chat";
import { Bot, Info } from "lucide-react";
import { useEffect } from "react";

export default function AskALJO() {
  const user = useUser();
  const navigate = useNavigate();
  const agentChat = useAgentChat(ALJOAssistantAgentChat);

  useEffect(() => {
    if (!user.isAuthenticated) {
      navigate(getPageUrl(LoginPage));
    }
  }, [user.isAuthenticated, navigate]);

  if (!user.isAuthenticated) {
    return null;
  }

  if (user.role !== "staff") {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">You are not authorized to access this page.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <div className="mx-auto w-full max-w-3xl flex flex-col flex-1 gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Bot className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ask ALJO</h1>
            <p className="text-sm text-muted-foreground">Get instant answers about ALJO CareCrew</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <Info className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ask me about document requirements, our services, or anything ALJO-related!
          </p>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden rounded-lg border shadow-sm">
          <AgentChatSimple agentChat={agentChat} variant="bubble" size="md" chatId="ask-aljo" />
        </div>
      </div>
    </div>
  );
}