import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductResponse {
  id: number;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
  image: string;
  disabled: boolean;
  sales: any[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ products: [], message: "GAME_SERVER_NOT_FOUND", extendedMessage: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const apiKey = authHeader.replace("Basic ", "");
    const decodedKey = atob(apiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("*")
      .eq("api_key", decodedKey)
      .single();

    if (serverError || !server) {
      return new Response(
        JSON.stringify({ products: [], message: "GAME_SERVER_NOT_FOUND", extendedMessage: "The game server does not exist. Create one in the ScapePulse dashboard." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    let query = supabase
      .from("products")
      .select("*, categories(name)")
      .eq("server_id", server.id)
      .eq("enabled", true);

    if (body.categoryId) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("server_id", server.id)
        .eq("numeric_id", body.categoryId)
        .single();
      
      if (category) {
        query = query.eq("category_id", category.id);
      }
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      return new Response(
        JSON.stringify({ products: [], message: "ERROR", extendedMessage: productsError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseProducts: ProductResponse[] = (products || []).map((p: any) => ({
      id: p.numeric_id || parseInt(p.id.replace(/\D/g, "")) || 1,
      productId: p.id,
      name: p.name,
      price: parseFloat(p.price),
      quantity: 1,
      description: p.description || "",
      image: p.image || "🎁",
      disabled: !p.enabled,
      sales: []
    }));

    return new Response(
      JSON.stringify({ message: "SUCCESS", products: responseProducts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ products: [], message: "ERROR", extendedMessage: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
