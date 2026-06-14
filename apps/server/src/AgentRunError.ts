import type { AgentRunTrace } from "@sensei/core";

export class AgentRunError extends Error {
  constructor(message: string, readonly trace: AgentRunTrace) {
    super(message);
    this.name = "AgentRunError";
  }
}
