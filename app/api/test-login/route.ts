import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// TEST-ONLY: Final canlı açılışında TEST_LOGIN_ENABLED=false yapılıp bu rota kaldırılacak.
const TEST_EMAIL = "info@respongo.com";
const isTestLoginEnabled = process.env.TEST_LOGIN_ENABLED !== "false";

export async function GET(request: Request) {
  if (!isTestLoginEnabled) return new NextResponse("Not found", { status: 404 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.redirect(new URL("/login?error=test_login_config", request.url));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: TEST_EMAIL });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return NextResponse.redirect(new URL("/login?error=test_login", request.url));

  const supabase = createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: "magiclink", email: TEST_EMAIL, token_hash: tokenHash });
  if (verifyError) return NextResponse.redirect(new URL("/login?error=test_login", request.url));

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
