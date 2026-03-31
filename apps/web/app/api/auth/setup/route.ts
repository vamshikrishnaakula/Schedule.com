import { defaultResponderForAppDir } from "app/api/defaultResponderForAppDir";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import selfHostedHandler from "../signup/handlers/selfHostedHandler";

// /api/auth/setup is used by the first-time setup UI to create an initial user.
// Delegate to self-hosted signup logic underneath.
export const GET = defaultResponderForAppDir(() => {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const mappedBody = {
      username: body.username,
      email: body.email_address ?? body.email,
      password: body.password,
      full_name: body.full_name,
      language: body.language,
      token: body.token,
    };

    const response = await selfHostedHandler(mappedBody);

    if (response.status === 409) {
      // Existing user on setup should be treated as already-setup in self-hosted flow.
      return NextResponse.json({ message: "User already exists" }, { status: 200 });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}