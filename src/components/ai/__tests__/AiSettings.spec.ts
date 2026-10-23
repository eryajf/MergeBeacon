import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AiSettings from "../AiSettings.vue";
import { aiListModels, aiTestConnection } from "@/api";
import { setAppLocale } from "@/i18n";

vi.mock("@/api", () => ({
  aiGetConfig: vi.fn().mockRejectedValue(new Error("no config")),
  aiSaveConfig: vi.fn(),
  aiSaveApiKey: vi.fn(),
  aiTestConnection: vi.fn(),
  aiListModels: vi.fn(),
}));

describe("AiSettings", () => {
  beforeEach(() => {
    setAppLocale("zh-CN");
    vi.mocked(aiListModels).mockResolvedValue([`gpt<img src=x onerror="alert(1)">model`]);
    vi.mocked(aiTestConnection).mockReset();
  });

  it("uses the local Magpie gateway by default", () => {
    const wrapper = mount(AiSettings);

    expect(
      (
        wrapper.get('.field input[placeholder="https://api.openai.com/v1"]')
          .element as HTMLInputElement
      ).value,
    ).toBe("http://127.0.0.1:3425/v1");
    expect((wrapper.get(".model-input-wrap input").element as HTMLInputElement).value).toBe("");
  });

  it("applies the DeepSeek v4 Flash preset", async () => {
    const wrapper = mount(AiSettings);
    const preset = wrapper.findAll("button").find((button) => button.text() === "DeepSeek");

    expect(preset).toBeDefined();
    await preset!.trigger("click");

    expect(
      (
        wrapper.get('.field input[placeholder="https://api.openai.com/v1"]')
          .element as HTMLInputElement
      ).value,
    ).toBe("https://api.deepseek.com/v1");
    expect((wrapper.get(".model-input-wrap input").element as HTMLInputElement).value).toBe(
      "deepseek-v4-flash",
    );
  });

  it("切换界面语言后立即更新设置文案", async () => {
    const wrapper = mount(AiSettings);

    setAppLocale("en-US");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Presets");
    expect(wrapper.text()).toContain("Local Ollama");
    expect(wrapper.text()).toContain("Fetch models");
    expect(wrapper.text()).not.toContain("预设配置");
  });

  it("将恶意模型 ID 作为纯文本渲染", async () => {
    const wrapper = mount(AiSettings);
    const fetchButton = wrapper.findAll("button").find((button) => button.text() === "获取模型");
    expect(fetchButton).toBeDefined();
    await fetchButton!.trigger("click");
    await flushPromises();
    const input = wrapper.get(".model-input-wrap input");
    await input.trigger("focus");
    await input.setValue("gpt");

    expect(wrapper.get(".model-item").text()).toContain('<img src=x onerror="alert(1)">');
    expect(wrapper.find(".model-item img").exists()).toBe(false);
    expect(wrapper.get(".model-item").element.querySelector("[onerror]")).toBeNull();
  });

  it("显示测试连接返回的具体错误", async () => {
    vi.mocked(aiTestConnection).mockRejectedValue({
      code: "ai",
      message: "AI API Key 无效或已失效，请检查 AI 设置",
      retryable: false,
      request_id: "err-test",
    });
    const wrapper = mount(AiSettings);
    const preset = wrapper.findAll("button").find((button) => button.text() === "OpenAI");
    expect(preset).toBeDefined();
    await preset!.trigger("click");
    const testButton = wrapper.findAll("button").find((button) => button.text() === "测试连接");
    expect(testButton).toBeDefined();

    await testButton!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("连接失败：AI API Key 无效或已失效，请检查 AI 设置");
  });
});
