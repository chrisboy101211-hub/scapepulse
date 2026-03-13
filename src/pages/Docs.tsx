import { Link } from "react-router-dom"
import NavBar from "@/components/NavBar"

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-6 py-20">
        <h1 className="font-display text-4xl font-bold mb-6">Documentation</h1>
        <p className="text-muted-foreground mb-8">
          Learn how to integrate ScapePulse with your game server.
        </p>
        
        <div className="space-y-8 max-w-3xl">
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-muted-foreground">
              Create an account and add your first server. Each server gets a unique API key for reward delivery.
            </p>
          </section>
          
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">API Integration</h2>
            <p className="text-muted-foreground mb-4">
              Use the API key from your server dashboard to connect your game server.
            </p>
            <pre className="bg-card border border-border rounded-lg p-4 text-sm overflow-x-auto">
{`// Example Java integration
private static final String API_URL = "https://your-project.supabase.co/functions/v1/store-transaction-v3";
private static final String SECRET_KEY = "your-api-key";`}
            </pre>
          </section>
          
          <section>
            <h2 className="font-display text-2xl font-semibold mb-4">Claiming Purchases</h2>
            <p className="text-muted-foreground">
              Call the transaction API when a player uses the /claim command in-game to receive their purchases.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Docs
