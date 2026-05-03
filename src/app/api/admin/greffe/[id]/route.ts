import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decideJudicialReview } from "@/lib/resolution";
import { runPipeline } from "@/lib/document-pipeline";

export const maxDuration = 60;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session?.user || (user?.role !== "ADMIN" && user?.role !== "ADMIN_GREFFE")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;
  const { decision, note } = (await req.json()) as {
    decision: "APPROVED" | "REJECTED";
    note: string;
  };
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    return NextResponse.json({ error: "Décision invalide" }, { status: 400 });
  }

  let requestId: string;
  try {
    const result = await decideJudicialReview(id, user!.id!, decision, note);
    requestId = result.requestId;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Si approuvé, on relance le pipeline original → casier judiciaire signé délivré
  if (decision === "APPROVED") {
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    after(async () => {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "PENDING", pipelineStep: "PENDING", exceptionReason: null },
      });
      await runPipeline(requestId, baseUrl);
    });
  }

  return NextResponse.json({ ok: true });
}
