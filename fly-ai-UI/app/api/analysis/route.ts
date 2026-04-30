

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // 🔥 If specific analysis requested
    if (id) {
      const analysis = await prisma.analysis.findFirst({
        where: {
          analysisId: id,
          userId: user.id,
        },
      });

      return NextResponse.json({ analysis });
    }

    const analyses = await prisma.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // 🔥 Group by batchId
    const grouped: Record<string, any[]> = {};

    analyses.forEach((item) => {
      const key = item.batchId || "single";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Convert to array format
    const batches = Object.entries(grouped).map(([batchId, items]) => ({
      batchId,
      items,
    }));

    return NextResponse.json({ batches });
  } catch (error) {
    console.error("Fetch analyses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { analysisId, reviewerStatus, measurement, point_8, point_13 } = body ?? {};

    if (!analysisId) {
      return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });
    }

    // Fetch existing record
    const existing = await prisma.analysis.findFirst({
      where: {
        analysisId: analysisId,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Merge safely with existing JSON
    const updatedJson = {
      ...(existing.resultJson as any),
      point_8,
      point_13,
      reviewerStatus,
    };

    await prisma.analysis.update({
      where: { id: existing.id },
      data: {
        reviewerStatus,
        measurement,
        resultJson: updatedJson,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}