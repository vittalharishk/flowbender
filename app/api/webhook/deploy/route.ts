import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.DEPLOY_WEBHOOK_SECRET || "flowbender_auto_deploy_secret_2026";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // If GitHub webhook signature is provided, verify it
    if (signature) {
      const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
      const digest = "sha256=" + hmac.update(rawBody).digest("hex");
      if (
        signature.length !== digest.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
      ) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      // Optional secret query param or header check for manual trigger
      const secretHeader = req.headers.get("x-webhook-secret");
      const url = new URL(req.url);
      const secretParam = url.searchParams.get("secret");

      if (secretHeader !== WEBHOOK_SECRET && secretParam !== WEBHOOK_SECRET) {
        return NextResponse.json(
          { error: "Unauthorized: Missing or invalid secret" },
          { status: 401 }
        );
      }
    }

    // Spawn deployment script detached so it doesn't block response
    const child = spawn("/home/flowbender/deploy.sh", [], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    return NextResponse.json({
      status: "success",
      message: "Deployment process triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    message: "Flowbender deploy webhook endpoint is alive",
  });
}
