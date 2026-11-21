// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSignedUrl } = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { storage: { from: () => ({ createSignedUrl }) } },
}));

import { useImageUrl } from "./shop";

describe("useImageUrl", () => {
  beforeEach(() => {
    createSignedUrl.mockReset();
  });

  it("switches to a new direct URL when the product image changes", () => {
    const { result, rerender } = renderHook(({ path }) => useImageUrl(path), {
      initialProps: { path: "https://images.example/old-product.jpg" },
    });

    expect(result.current).toBe("https://images.example/old-product.jpg");
    rerender({ path: "https://images.example/new-product.jpg" });
    expect(result.current).toBe("https://images.example/new-product.jpg");
  });

  it("replaces the signed URL when the storage path changes", async () => {
    createSignedUrl.mockImplementation(async (path: string) => ({
      data: { signedUrl: `https://signed.example/${path}` },
      error: null,
    }));

    const { result, rerender } = renderHook(({ path }) => useImageUrl(path), {
      initialProps: { path: "products/first-image-test.jpg" },
    });

    await waitFor(() =>
      expect(result.current).toBe("https://signed.example/products/first-image-test.jpg"),
    );
    rerender({ path: "products/second-image-test.jpg" });
    expect(result.current).toBeUndefined();
    await waitFor(() =>
      expect(result.current).toBe("https://signed.example/products/second-image-test.jpg"),
    );
  });
});
