import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, ChevronDown, Clipboard, Loader2, Send, Trophy, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

const phpCallbackExample = `<?php
$uid = $_GET['uid'] ?? $_POST['uid'] ?? '';
$isTest = ($_GET['test'] ?? $_POST['test'] ?? '') === '1';

if ($isTest) {
    http_response_code(200); // The tester reached your endpoint.
    exit;
}

if ($uid === '') {
    http_response_code(400);
    exit;
}

// Look up this uid in the vote records you created for the player.
// Grant the reward, then mark the uid as processed so it cannot be reused.
http_response_code(200);`

const supabaseCallbackExample = `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid") ?? "";
  const isTest = url.searchParams.get("test") === "1";

  if (isTest) return new Response("OK", { status: 200 });
  if (!uid) return new Response("Missing uid", { status: 400 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // Find uid in your pending vote table, issue the reward, and mark it processed.
  return new Response("OK", { status: 200 });
});`

export default function CallbackSetup() {
  const { user } = useAuth()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ delivered: boolean; status?: number; message: string } | null>(null)
  const [copied, setCopied] = useState<"php" | "supabase" | null>(null)
  const [testUsername, setTestUsername] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!user) return
    toplistDataService.getUserServer(user.id).then(setServer).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const copy = async (kind: "php" | "supabase", value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    window.setTimeout(() => setCopied(null), 1800)
  }

  const test = async () => {
    if (!server) return
    const username = testUsername.trim()
    if (username && !/^[a-zA-Z0-9_ -]{1,64}$/.test(username)) {
      setResult({ delivered: false, message: "Test username may only contain letters, numbers, spaces, underscores, and hyphens." })
      return
    }
    setTesting(true)
    setCooldown(10)
    setResult(null)
    try {
      setResult(await toplistDataService.testCallback(server.id, username))
    } catch (err: any) {
      setResult({ delivered: false, message: err?.message || "The callback test could not be completed." })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (!server) return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3"><Trophy className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Callback Setup</h1></div>
      <div className="rounded-lg border border-border/40 p-6 text-center">
        <p className="mb-4 text-sm text-muted-foreground">Submit a server listing before configuring its callback.</p>
        <Link to="/toplist/submit" className="inline-flex rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Submit Your Server</Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Callback Setup</h1><p className="mt-1 text-sm text-muted-foreground">Set up and test the callback for {server.name}.</p></div>
      <section className="overflow-hidden rounded-lg border border-border/40">
        <div className="border-b border-border/40 bg-secondary/15 px-5 py-4"><h2 className="text-base font-semibold text-foreground">Callback Guide &amp; Tester</h2><p className="mt-1 text-xs text-muted-foreground">Receive a request after every confirmed vote, then test your saved endpoint.</p></div>
        <div className="space-y-3 p-5">
          <div className="rounded border border-border/50 bg-secondary/10 p-4"><h3 className="text-sm font-semibold text-foreground">Your server vote URL</h3><p className="mt-1 text-xs text-muted-foreground">Use this working ScapePulse URL on your server's vote button. Replace <code className="text-foreground">{'{sid}'}</code> with your listing ID and <code className="text-foreground">{'{incentive}'}</code> with the unique incentive you create for that player.</p><code className="mt-3 block break-all rounded bg-background/70 px-3 py-2 text-xs text-foreground">https://scapepulse.com/toplist/vote/{'{sid}'}/{'{incentive}'}</code></div>
          <p className="text-sm text-muted-foreground">ScapePulse calls your saved callback URL with <code className="text-foreground">uid</code> and <code className="text-foreground">voter_name</code>. URLs with parameters are supported, such as <code className="break-all text-foreground">https://example.com/api/vote/callback?postback=</code>.</p>
          <details className="group rounded border border-border/50 bg-secondary/10"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-foreground">PHP callback example <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" /></summary><CodeExample value={phpCallbackExample} copied={copied === "php"} onCopy={() => copy("php", phpCallbackExample)} /></details>
          <details className="group rounded border border-border/50 bg-secondary/10"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-foreground">Supabase Edge Function example <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" /></summary><CodeExample value={supabaseCallbackExample} copied={copied === "supabase"} onCopy={() => copy("supabase", supabaseCallbackExample)} /></details>
          <div className="rounded border border-primary/20 bg-primary/5 p-4"><h3 className="text-sm font-semibold text-foreground">Test your saved callback URL</h3><p className="mt-1 text-xs text-muted-foreground">This sends a GET request containing a temporary <code>uid</code> and <code>test=1</code>. It never creates a vote or grants a reward.</p>{!server.callback_url?.trim() ? <p className="mt-3 text-sm text-amber-300">Add a callback URL in <Link className="underline" to="/dashboard/toplist">My Listing</Link>, then save it before testing.</p> : <div className="mt-3 space-y-3"><div><label htmlFor="test-username" className="mb-1.5 block text-xs font-medium text-foreground">Test username <span className="font-normal text-muted-foreground">(optional)</span></label><input id="test-username" value={testUsername} onChange={(event) => setTestUsername(event.target.value)} maxLength={64} placeholder="PlayerOne" className="w-full max-w-sm rounded border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/70" /><p className="mt-1 text-xs text-muted-foreground">Sent as <code>voter_name</code>. Leave blank to use ScapePulse_Test.</p></div><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={test} disabled={testing || cooldown > 0} className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">{testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{testing ? "Testing…" : cooldown > 0 ? `Try again in ${cooldown}s` : "Send Test Callback"}</button>{result && <p className={`flex items-center gap-1.5 text-xs ${result.delivered ? "text-emerald-400" : "text-red-300"}`}>{result.delivered ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{result.message}{result.status ? ` (HTTP ${result.status})` : ""}</p>}</div></div>}</div>
        </div>
      </section>
    </div>
  )
}

function CodeExample({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) {
  return <div className="border-t border-border/40 p-3"><div className="mb-2 flex justify-end"><button type="button" onClick={onCopy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Clipboard className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy code"}</button></div><pre className="overflow-x-auto rounded bg-background/70 p-3 text-xs leading-5 text-foreground"><code>{value}</code></pre></div>
}
