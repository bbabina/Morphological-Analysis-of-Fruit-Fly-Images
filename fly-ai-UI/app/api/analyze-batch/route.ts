import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
const AI_BACKEND_URL = "http://127.0.0.1:8000/analyze";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Get authenticated user
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔥 Generate batchId for this upload
    const batchId = randomUUID();

    const results: any[] = [];

    for (const file of files) {
      const singleForm = new FormData();
      singleForm.append("file", file);

      // Call FastAPI analyze endpoint
      const res = await fetch(AI_BACKEND_URL, {
        method: "POST",
        body: singleForm,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("FastAPI failed:", text);
        continue;
      }

      const data = await res.json();

      // Validate backend response
      if (!data || data.status !== "success") {
        console.error("Invalid response from AI backend");
        continue;
      }

      // Save result to database
      await prisma.analysis.create({
        data: {
          userId: user.id,
          imageUrl: data?.metadata?.saved_filename || "uploaded_image",
          resultJson: data,
          analysisId: data?.metadata?.analysis_id ?? "unknown",
          batchId: batchId,
          reviewerStatus: data?.reviewer_status || "pending",
          measurement: data?.measurement?.length_mm ?? null,
        },
      });

      results.push(data);
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "All files failed to process" },
        { status: 500 }
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Batch API Error:", error);
    return NextResponse.json({ error: "Batch analysis failed" }, { status: 500 });
  }
}