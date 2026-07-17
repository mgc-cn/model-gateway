import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n/i18n";
import WorkflowRuns from "./WorkflowRuns";

const now = new Date("2026-07-15T10:00:00Z").getTime();

const run = {
  run_id: "run-1234567890",
  status: "running",
  workflow_type: "code_review",
  created_at: "2026-07-15T09:55:00Z",
  metadata: {
    title: "代码审查流程",
    state: "running",
    worktree_path: "/workspace/review",
    session_id: "session-001",
  },
};

function jsonResponse(data: unknown): Response {
  return { ok: true, json: vi.fn().mockResolvedValue(data) } as unknown as Response;
}

function mockWorkflowFetch(options?: { empty?: boolean; noDetails?: boolean; longWorktree?: boolean }) {
  const selectedRun = options?.longWorktree
    ? {
        ...run,
        metadata: {
          ...run.metadata,
          worktree_path: `/workspace/${"very-long-path/".repeat(12)}`,
        },
      }
    : run;

  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/events")) {
      return jsonResponse(
        options?.noDetails
          ? { events: [] }
          : {
              events: [
                {
                  event_id: "event-1",
                  event_type: "step.started",
                  step_name: "analyze",
                  sequence_number: 1,
                  created_at: "2026-07-15T09:55:01Z",
                  data: { model: "gpt-4.1" },
                },
              ],
            },
      );
    }
    if (url.includes("/messages")) {
      return jsonResponse(
        options?.noDetails
          ? { messages: [] }
          : {
              messages: [
                {
                  message_id: "message-1",
                  role: "assistant",
                  content: "审查已经完成",
                  sequence_number: 1,
                  created_at: "2026-07-15T09:55:02Z",
                },
              ],
            },
      );
    }
    return jsonResponse({ runs: options?.empty ? [] : [selectedRun] });
  });
}

describe("workflow runs Chinese localization", () => {
  beforeEach(async () => {
    vi.spyOn(Date, "now").mockReturnValue(now);
    await act(async () => {
      await i18n.changeLanguage("zh-CN");
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("localizes the workflow list, columns, refresh action, and empty state", async () => {
    vi.stubGlobal("fetch", mockWorkflowFetch({ empty: true }));
    render(<WorkflowRuns accessToken="test-token" />);

    expect(screen.getByText("工作流运行")).toBeInTheDocument();
    expect(screen.getByText("持久化跟踪智能体和自动化工作流的运行状态")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /刷新/ })).toBeInTheDocument();
    expect(screen.getByText("运行")).toBeInTheDocument();
    expect(screen.getByText("类型")).toBeInTheDocument();
    expect(screen.getByText("状态")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(await screen.findByText("暂无工作流运行记录")).toBeInTheDocument();
  });

  it("localizes status, relative time, timeline, and message roles in run details", async () => {
    vi.stubGlobal("fetch", mockWorkflowFetch());
    const user = userEvent.setup();
    render(<WorkflowRuns accessToken="test-token" />);

    expect(await screen.findByText("代码审查流程")).toBeInTheDocument();
    expect(screen.getByText("运行中")).toBeInTheDocument();
    expect(screen.getByText("5 分钟前")).toBeInTheDocument();

    await user.click(screen.getByText("代码审查流程").closest("tr")!);
    expect(await screen.findByRole("button", { name: /关闭/ })).toBeInTheDocument();
    expect(screen.getByText("工作树")).toBeInTheDocument();
    expect(screen.getByText("时间线")).toBeInTheDocument();
    expect(screen.getByText("1 个事件")).toBeInTheDocument();
    expect(screen.getByText("step.started")).toBeInTheDocument();

    await user.click(screen.getByText("消息"));
    expect(await screen.findByText("[助手]")).toBeInTheDocument();
    expect(screen.getByText("审查已经完成")).toBeInTheDocument();
  });

  it("localizes empty detail sections and long-value expansion", async () => {
    vi.stubGlobal("fetch", mockWorkflowFetch({ noDetails: true, longWorktree: true }));
    const user = userEvent.setup();
    render(<WorkflowRuns accessToken="test-token" />);

    await user.click((await screen.findByText("代码审查流程")).closest("tr")!);
    expect(await screen.findByText("暂无事件记录")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "展开" }));
    expect(screen.getByRole("button", { name: "收起" })).toBeInTheDocument();

    await user.click(screen.getByText("消息"));
    await waitFor(() => expect(screen.getByText("暂无消息")).toBeInTheDocument());
  });
});
