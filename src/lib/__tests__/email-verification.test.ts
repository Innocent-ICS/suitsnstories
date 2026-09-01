import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock, sendEmailMock } = vi.hoisted(() => {
  const dbMock = {
    $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
    emailVerificationToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  const sendEmailMock = vi.fn();

  return { dbMock, sendEmailMock };
});

vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("@/lib/email/resend", () => ({ sendEmail: sendEmailMock }));

import {
  hashEmailVerificationToken,
  sendVerificationEmailForAddress,
  sendVerificationEmailForUser,
  verifyEmailToken,
} from "@/lib/email-verification";

describe("email verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";

    dbMock.emailVerificationToken.create.mockResolvedValue({});
    dbMock.emailVerificationToken.deleteMany.mockResolvedValue({ count: 0 });
    dbMock.user.findUnique.mockResolvedValue(null);
    dbMock.user.update.mockResolvedValue({});
    sendEmailMock.mockResolvedValue(true);
  });

  it("creates a hashed verification token and sends a verification link", async () => {
    const result = await sendVerificationEmailForUser({
      id: "user_1",
      email: "Ada@Example.com",
      name: "Ada Lovelace",
      emailVerified: null,
    });

    expect(result).toEqual({ success: true, message: "Verification email sent." });
    expect(dbMock.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
    });
    expect(dbMock.emailVerificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_1",
        email: "ada@example.com",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });

    const sentEmail = sendEmailMock.mock.calls[0][0];
    expect(sentEmail.to).toBe("ada@example.com");
    expect(sentEmail.subject).toBe("Verify your Suits & Stories email");

    const verifyUrl = sentEmail.text.match(/https:\/\/\S+/)?.[0];
    const token = verifyUrl ? new URL(verifyUrl).searchParams.get("token") : null;
    const tokenHash = dbMock.emailVerificationToken.create.mock.calls[0][0].data.tokenHash;

    expect(token).toBeTruthy();
    expect(tokenHash).toBe(hashEmailVerificationToken(token!));
    expect(tokenHash).not.toBe(token);
  });

  it("marks a user verified and deletes outstanding tokens for a valid token", async () => {
    const token = "plain-verification-token";
    dbMock.emailVerificationToken.findUnique.mockResolvedValue({
      userId: "user_1",
      email: "ada@example.com",
      expiresAt: new Date(Date.now() + 60_000),
    });
    dbMock.user.findUnique.mockResolvedValue({
      emailVerified: null,
    });

    const result = await verifyEmailToken(token);

    expect(result).toEqual({ success: true, message: "Email verified. You can sign in now." });
    expect(dbMock.emailVerificationToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashEmailVerificationToken(token) },
      select: {
        userId: true,
        email: true,
        expiresAt: true,
      },
    });
    expect(dbMock.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        email: "ada@example.com",
        emailVerified: expect.any(Date),
      },
    });
    expect(dbMock.emailVerificationToken.deleteMany).toHaveBeenLastCalledWith({
      where: { userId: "user_1" },
    });
  });

  it("deletes expired tokens and asks for a new link", async () => {
    const token = "expired-token";
    dbMock.emailVerificationToken.findUnique.mockResolvedValue({
      userId: "user_1",
      email: "ada@example.com",
      expiresAt: new Date(Date.now() - 60_000),
    });

    const result = await verifyEmailToken(token);

    expect(result).toEqual({
      success: false,
      error: "Verification link has expired. Request a new one to continue.",
    });
    expect(dbMock.user.update).not.toHaveBeenCalled();
    expect(dbMock.emailVerificationToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: hashEmailVerificationToken(token) },
    });
  });

  it("returns a neutral resend response when the email is unknown", async () => {
    dbMock.user.findFirst.mockResolvedValue(null);

    const result = await sendVerificationEmailForAddress("missing@example.com");

    expect(result).toEqual({
      success: true,
      message: "If an unverified account exists for that email, a new verification link has been sent.",
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
