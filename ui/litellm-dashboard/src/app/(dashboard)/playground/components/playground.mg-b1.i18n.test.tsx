import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "@/i18n/i18n";
import type { MessageType } from "@/components/chat_ui/types";
import AudioRenderer from "./chat_ui/AudioRenderer";
import { MessageDisplay } from "./compareUI/components/MessageDisplay";

describe("Playground MG-B1 localization", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders compare response states in Simplified Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const message = { role: "user", content: "hello" } as MessageType;
    render(<MessageDisplay messages={[message]} isLoading={false} />);

    expect(screen.getByText("您")).toBeInTheDocument();
    expect(screen.getByText("正在等待回复...")).toBeInTheDocument();
  });

  it("localizes the audio fallback", async () => {
    await i18n.changeLanguage("zh-CN");
    const message = { role: "assistant", content: "audio.wav", isAudio: true } as MessageType;
    render(<AudioRenderer message={message} />);

    expect(screen.getByText("您的浏览器不支持音频播放。")).toBeInTheDocument();
  });
});
