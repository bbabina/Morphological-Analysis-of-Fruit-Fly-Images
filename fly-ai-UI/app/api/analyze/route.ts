export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Forward request to Python AI backend
    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        { error: "Python API error", details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save analysis result to database (temporary userId for now)
    await prisma.analysis.create({
      data: {
        userId: user.id,
        imageUrl: "uploaded_image",
        resultJson: data,
        analysisId: data?.metadata?.analysis_id ?? "unknown",
        reviewerStatus: "pending",
        measurement: data?.measurement?.length_mm ?? null,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      { error: "Failed to connect to AI backend" },
      { status: 500 }
    );
  }
}