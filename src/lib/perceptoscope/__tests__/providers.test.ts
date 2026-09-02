import { afterEach, describe, expect, it, vi } from "vitest";
import { callPerceptoscopeModel, chooseProvider } from "../providers";

describe("Perceptoscope provider routing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("honors an OpenRouter provider override even when Groq is also configured", () => {
    vi.stubEnv("GROQ_KEY", "gsk_test");
    vi.stubEnv("OPEN_ROUTER_KEY", "sk-or-v1-test");
    vi.stubEnv("PERCEPTOSCOPE_PROVIDER", "OPENROUTER");

    expect(chooseProvider({ hasImages: true })).toBe("OPENROUTER");
  });

  it("adds free-only OpenRouter routing for free model tests", async () => {
    vi.stubEnv("OPEN_ROUTER_KEY", "sk-or-v1-test");
    vi.stubEnv("PERCEPTOSCOPE_OPENROUTER_MODEL", "openai/gpt-5.6-luna");
    vi.stubEnv("PERCEPTOSCOPE_TEST_MODE", "true");
    vi.stubEnv("PERCEPTOSCOPE_OPENROUTER_TEST_MODEL", "dots-studio/dots-3-note-preview:free");
    vi.stubEnv("PERCEPTOSCOPE_OPENROUTER_FREE_ONLY", "true");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "{\"ok\":true}" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await callPerceptoscopeModel<{ ok: boolean }>("OPENROUTER", {
      system: "Return JSON.",
      prompt: "Return an ok object.",
      pdf: {
        filename: "deck.pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0x",
        useOcr: true,
      },
      maxTokens: 40,
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

    expect(result.data).toEqual({ ok: true });
    expect(requestBody.model).toBe("dots-studio/dots-3-note-preview:free");
    expect(requestBody.plugins).toBeUndefined();
    expect(requestBody.messages[1].content).not.toContainEqual(
      expect.objectContaining({ type: "file" })
    );
    expect(requestBody.provider).toEqual({
      require_parameters: true,
      max_price: { prompt: 0, completion: 0, image: 0 },
    });
  });

  it("allows paid OpenRouter model experiments when free-only routing is disabled", async () => {
    vi.stubEnv("OPEN_ROUTER_KEY", "sk-or-v1-test");
    vi.stubEnv("PERCEPTOSCOPE_OPENROUTER_MODEL", "openai/gpt-5.6-luna");
    vi.stubEnv("PERCEPTOSCOPE_TEST_MODE", "false");
    vi.stubEnv("PERCEPTOSCOPE_OPENROUTER_FREE_ONLY", "false");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "{\"ok\":true}" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await callPerceptoscopeModel<{ ok: boolean }>("OPENROUTER", {
      system: "Return JSON.",
      prompt: "Return an ok object.",
      maxTokens: 40,
    });

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));

    expect(requestBody.model).toBe("openai/gpt-5.6-luna");
    expect(requestBody.provider).toEqual({ require_parameters: true });
  });
});
