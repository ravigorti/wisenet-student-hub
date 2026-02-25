import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();

    // Support both modes: legacy { text } and new { pre_read_id }
    if (body.text && typeof body.text === "string") {
      // Legacy: direct text summarization
      return await summarizeText(body.text);
    }

    const { pre_read_id, prompt } = body;
    if (!pre_read_id) {
      return jsonResponse({ error: "pre_read_id is required" }, 400);
    }

    // 1) Get pre_read record
    const { data: preRead, error: prError } = await supabase
      .from("pre_reads")
      .select("*")
      .eq("id", pre_read_id)
      .single();

    if (prError || !preRead) {
      return jsonResponse({ error: "Pre-read not found" }, 404);
    }

    // 2) Update status to generating
    await supabase
      .from("pre_reads")
      .update({
        summary_status: "generating",
        summary_prompt: prompt || null,
      })
      .eq("id", pre_read_id);

    // 3) Download PDF from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from("pre-reads")
      .download(preRead.file_path);

    if (dlError || !fileData) {
      await supabase
        .from("pre_reads")
        .update({ summary_status: "error", summary_text: "Failed to download PDF from storage." })
        .eq("id", pre_read_id);
      return jsonResponse({ error: "Failed to download PDF" }, 500);
    }

    // 4) Extract text from PDF (basic extraction - look for text between stream markers)
    const bytes = new Uint8Array(await fileData.arrayBuffer());
    let extractedText = "";

    // Try to extract readable text from the PDF binary
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawText = decoder.decode(bytes);

    // Extract text content between parentheses (PDF text objects)
    const textMatches = rawText.match(/\(([^)]+)\)/g);
    if (textMatches) {
      extractedText = textMatches
        .map((m) => m.slice(1, -1))
        .filter((t) => t.length > 2 && /[a-zA-Z]/.test(t))
        .join(" ");
    }

    // Also try BT/ET text blocks
    const btBlocks = rawText.match(/BT[\s\S]*?ET/g);
    if (btBlocks) {
      for (const block of btBlocks) {
        const tjMatches = block.match(/\(([^)]+)\)\s*Tj/g);
        if (tjMatches) {
          const text = tjMatches.map((m) => {
            const match = m.match(/\(([^)]+)\)/);
            return match ? match[1] : "";
          }).join(" ");
          if (text.length > extractedText.length) {
            extractedText = text;
          }
        }
      }
    }

    if (!extractedText || extractedText.trim().length < 50) {
      await supabase
        .from("pre_reads")
        .update({
          summary_status: "error",
          summary_text:
            "Could not extract enough text from this PDF. It may be image-based or encrypted. Try uploading a text-based PDF.",
        })
        .eq("id", pre_read_id);
      return jsonResponse({
        error: "Insufficient text extracted from PDF",
      }, 422);
    }

    // Truncate to ~4000 chars for BART
    const truncated = extractedText.slice(0, 4000);

    // 5) Build input with optional prompt
    let input = truncated;
    if (prompt && prompt.trim()) {
      input = `Instruction: ${prompt.trim()}\n\nContent: ${truncated}`;
    }

    // 6) Call Hugging Face
    const summary = await callHuggingFace(input);

    // 7) Save result
    await supabase
      .from("pre_reads")
      .update({
        summary_status: "ready",
        summary_text: summary,
        summarized_at: new Date().toISOString(),
        summary_model: "hf:facebook/bart-large-cnn",
      })
      .eq("id", pre_read_id);

    return jsonResponse({ summary });
  } catch (e) {
    console.error("Summarize error:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500
    );
  }
});

async function callHuggingFace(text: string): Promise<string> {
  const HF_TOKEN = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
  if (!HF_TOKEN) {
    throw new Error("HUGGING_FACE_ACCESS_TOKEN is not configured");
  }

  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: { max_length: 150, min_length: 30, do_sample: false },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("HF API error:", response.status, errorText);
    if (response.status === 503) {
      throw new Error("Model is loading. Please try again in a few seconds.");
    }
    throw new Error(`Hugging Face API error: ${response.status}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result[0]?.summary_text : result?.summary_text || "No summary generated.";
}

async function summarizeText(text: string) {
  if (!text.trim()) {
    return jsonResponse({ error: "No text provided" }, 400);
  }
  const truncated = text.slice(0, 4000);
  try {
    const summary = await callHuggingFace(truncated);
    return jsonResponse({ summary });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
}
