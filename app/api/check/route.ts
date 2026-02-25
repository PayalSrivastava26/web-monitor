import axios from "axios";
import * as cheerio from "cheerio";
import { diffLines } from "diff";
import { supabase } from "@/app/lib/supabase";

export async function POST(req: Request) {
  try {
    const baseUrl = new URL(req.url).origin;

    const { data: links, error: linksError } = await supabase
      .from("links")
      .select("*");

    if (linksError) {
      return Response.json({ error: "Failed to fetch links" }, { status: 500 });
    }

    if (!links || links.length === 0) {
      return Response.json({ error: "No links to check. Add some links first!" }, { status: 400 });
    }

    const results = [];

    for (const link of links) {
      try {
        const normalizedUrl = link.url.startsWith("http") ? link.url : `https://${link.url}`;

        const response = await axios.get(normalizedUrl, { timeout: 15000 });
        const $ = cheerio.load(response.data);
        const pageText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 200000);

        const { data: lastSnapshot } = await supabase
          .from("snapshots")
          .select("*")
          .eq("link_id", link.id)
          .order("created_at", { ascending: false })
          .limit(1);

        let diffText = "First snapshot — baseline saved.";
        let changed = false;

        if (lastSnapshot && lastSnapshot.length > 0) {
          const diff = diffLines(lastSnapshot[0].content || "", pageText);
          const changedParts = diff.filter((part) => part.added || part.removed);
          changed = changedParts.length > 0;
          diffText = changed
            ? changedParts.map((part) => (part.added ? `+ ${part.value}` : `- ${part.value}`)).join("\n")
            : "No visible content changes detected.";
        }

        await supabase.from("snapshots").insert({ link_id: link.id, content: pageText });

        const { data: insertedCheck } = await supabase
          .from("checks")
          .insert({ link_id: link.id, diff: diffText })
          .select()
          .single();

        // Keep only last 5 snapshots
        const { data: allSnaps } = await supabase
          .from("snapshots").select("id").eq("link_id", link.id).order("created_at", { ascending: false });
        if (allSnaps && allSnaps.length > 5) {
          const toDelete = allSnaps.slice(5).map((s) => s.id);
          await supabase.from("snapshots").delete().in("id", toDelete);
        }

        // Get AI summary
        let summary = "";
        if (insertedCheck) {
          try {
            const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ checkId: insertedCheck.id }),
            });
            const analyzeData = await analyzeRes.json();
            summary = analyzeData.summary || "";
          } catch {}
        }

        results.push({ url: link.url, tag: link.tag, changed, diff: diffText, summary, error: null });
      } catch (linkError: any) {
        results.push({ url: link.url, tag: link.tag, changed: false, diff: "", summary: "", error: linkError.message });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: "Check process failed" }, { status: 500 });
  }
}