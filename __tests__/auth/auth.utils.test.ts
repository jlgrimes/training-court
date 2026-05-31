import { getSafeRedirectPath, getSiteUrl } from "@/utils/auth";

describe("auth URL utilities", () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    delete process.env.VERCEL_URL;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it("uses a configured canonical site URL without a trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://trainingcourt.app/";

    expect(getSiteUrl()).toBe("https://trainingcourt.app");
  });

  it("defaults to the local app URL during local development", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("allows only application-relative redirect paths", () => {
    expect(getSafeRedirectPath("/reset-password")).toBe("/reset-password");
    expect(getSafeRedirectPath("https://example.com/reset")).toBe("/home");
    expect(getSafeRedirectPath("//example.com/reset")).toBe("/home");
  });
});
