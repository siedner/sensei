import { runMockAction, type AgentAdapter, type CopilotInput, type ResolvedSkillContext } from "@sensei/core";

export class MockAdapter implements AgentAdapter {
  async run(input: CopilotInput, context: ResolvedSkillContext) {
    return runMockAction(input, context);
  }
}
