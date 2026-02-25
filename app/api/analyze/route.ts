import { supabase } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
    const { checkId } = await req.json();

    const { data: check, error } = await supabase
      .from("checks")
      .select("*")
      .eq("id", checkId)
      .single();

    if (error || !check) {
      return Response.json({ error: "Check not found" }, { status: 404 });
    }

    const diff = check.diff || "No changes detected";

    if (diff === "No visible content changes detected." || diff === "First snapshot — baseline saved.") {
      return Response.json({ summary: diff });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: "Summarize website changes in 2-3 bullet points. Cite short phrases from the diff.",
          },
          {
            role: "user",
            content: diff,
          },
        ],
      }),
    });

    const data = await res.json();
    console.log("OpenAI response:", data);

    if (!res.ok) {
      return Response.json({ summary: "AI summary unavailable: " + (data.error?.message || "quota exceeded") });
    }

    const summary = data.choices?.[0]?.message?.content || "No summary generated.";
    await supabase.from("checks").update({ summary }).eq("id", checkId);

    return Response.json({ summary });
  } catch (err) {
    console.error("AI analysis failed:", err);
    return Response.json({ summary: "AI summary unavailable." });
  }
}