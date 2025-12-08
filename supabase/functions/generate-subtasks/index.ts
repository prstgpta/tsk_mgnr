import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  taskTitle: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { taskTitle }: RequestBody = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: "taskTitle is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured in Supabase environment");
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase project settings." 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are a helpful assistant that breaks down big tasks into simple, clear subtasks. Given a main task title, return a list of 5 to 7 clear, short subtasks needed to complete it. The subtasks should be practical and written in plain language. Return them as a plain JSON array of strings. Do not include any extra text or explanations.`;

    console.log(`Generating subtasks for task: "${taskTitle}"`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Generate subtasks for: ${taskTitle}`,
          },
        ],
        temperature: 1,
        max_completion_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error response:", errorData);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.statusText}. Check Supabase logs for details.` 
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let subtasks: string[] = [];
    try {
      subtasks = JSON.parse(content);
      if (!Array.isArray(subtasks)) {
        subtasks = [content];
      }
    } catch {
      subtasks = [content];
    }

    console.log(`Generated ${subtasks.length} subtasks`);

    return new Response(
      JSON.stringify({ subtasks }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
