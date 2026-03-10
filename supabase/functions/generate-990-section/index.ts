import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SECTION_PROMPTS: Record<string, string> = {
  org_info: `You are helping a nonprofit complete the Organization Information section of IRS Form 990.
Review the provided organization data and generate any missing or suggested fields.
Focus on: legal name verification, address formatting, website, formation year, state of legal domicile, and group exemption number if applicable.
Return a JSON object with field suggestions. For each field, provide a "value" and "explanation" of why you suggest it.`,

  revenue: `You are helping a nonprofit complete the Revenue section of IRS Form 990.
Using the provided donation and grant data, calculate and suggest values for:
- Line 1: Contributions, gifts, grants (total from donations + grants)
- Line 2: Program service revenue
- Line 8: Investment income
- Line 9: Other revenue
- Line 12: Total revenue
Provide calculations showing how you derived each number. Flag any inconsistencies.
Return a JSON object with line items, each having "value", "calculation", and any "warnings".`,

  expenses: `You are helping a nonprofit complete the Expenses section of IRS Form 990.
Based on the organization's data, suggest reasonable expense allocations across:
- Line 13: Grants and similar amounts paid
- Line 15: Salaries and compensation
- Line 16: Employee benefits
- Line 22: Depreciation
- Line 24: Other expenses
- Line 25: Total functional expenses
Help allocate between Program Services, Management & General, and Fundraising columns.
Return a JSON object with line items and allocation suggestions.`,

  officers: `You are helping a nonprofit complete the Officers, Directors, and Key Employees section of IRS Form 990 (Part VII).
Using the provided board member data, format each person's entry with:
- Name and title
- Average hours per week
- Position checkboxes (officer, director, trustee, key employee)
- Reportable compensation
- Other compensation
- Estimated amount of other compensation from the organization and related organizations
Flag any board members missing required information.
Return a JSON object with formatted officer entries and any warnings.`,

  mission: `You are helping a nonprofit write the Mission and Program Accomplishments section of IRS Form 990 (Part III).
Generate:
1. A concise mission statement (1-2 sentences) appropriate for IRS filing
2. Up to 3 program service accomplishments with:
   - Description of the program
   - Achievements and impact metrics
   - Revenue and expenses for each program
Use professional, factual language. Avoid marketing speak. Focus on measurable outcomes.
Return a JSON object with "mission_statement" and "program_accomplishments" array.`,

  governance: `You are helping a nonprofit complete the Governance, Management, and Disclosure section of IRS Form 990 (Part VI).
Based on the organization's board data and policies, answer these governance questions:
- Number of voting members of governing body
- Number of independent voting members
- Did the organization delegate control over management duties?
- Did the organization have any significant changes to governing documents?
- Does the organization have a written conflict of interest policy?
- Does the organization have a written whistleblower policy?
- Does the organization have a written document retention and destruction policy?
- Process for reviewing Form 990 before filing
Flag any governance gaps or risks.
Return a JSON object with answers and recommendations for each question.`,

  financial_statements: `You are helping a nonprofit complete the Financial Statements section of IRS Form 990 (Part X - Balance Sheet).
Based on available data, suggest entries for:
- Cash and cash equivalents
- Accounts receivable
- Pledges and grants receivable
- Total assets
- Accounts payable
- Total liabilities
- Net assets (unrestricted, temporarily restricted, permanently restricted)
Provide a reconciliation check ensuring assets = liabilities + net assets.
Return a JSON object with balance sheet items and reconciliation status.`,
};

const FORM_TYPE_CONTEXT: Record<string, string> = {
  "990-N": `This is a Form 990-N (e-Postcard) filing for organizations with gross receipts normally $50,000 or less.
The 990-N is extremely simple and only requires:
1. Legal name and mailing address
2. EIN
3. Tax year
4. Name and address of principal officer
5. Website address (if applicable)
6. Confirmation the organization's gross receipts are normally $50,000 or less
7. If applicable, a statement that the organization has terminated or is terminating
Keep responses minimal and focused on these required fields only.`,

  "990-EZ": `This is a Form 990-EZ (Short Form) filing for organizations with gross receipts less than $200,000 and total assets less than $500,000.
The 990-EZ has these key parts:
- Revenue, Expenses, and Changes in Net Assets (Part I)
- Balance Sheets (Part II)
- Statement of Program Service Accomplishments (Part III)
- List of Officers, Directors, Trustees (Part IV)
- Other Information (Part V)
- Section 501(c)(3) Organizations Only (Part VI)
Be thorough but proportional to the organization's size.`,

  "990": `This is a full Form 990 filing for organizations with gross receipts of $200,000 or more, or total assets of $500,000 or more.
The full 990 is comprehensive with 12 parts plus schedules:
- Summary (Part I), Signature Block (Part II), Statement of Program Service Accomplishments (Part III)
- Checklist of Required Schedules (Part IV), Statements Regarding Other IRS Filings (Part V)
- Governance, Management, and Disclosure (Part VI), Compensation (Part VII)
- Statement of Revenue (Part VIII), Statement of Functional Expenses (Part IX)
- Balance Sheet (Part X), Reconciliation of Net Assets (Part XI)
- Financial Statements and Reporting (Part XII)
Provide detailed, comprehensive responses appropriate for a full filing.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { section_key, form_type, organization, existing_data, board_members, grants, donations } = body;

    if (!section_key || !form_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: section_key, form_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sectionPrompt = SECTION_PROMPTS[section_key];
    if (!sectionPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown section: ${section_key}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formContext = FORM_TYPE_CONTEXT[form_type] || FORM_TYPE_CONTEXT["990"];

    const contextData = {
      organization: organization || {},
      existing_data: existing_data || {},
      board_members: board_members || [],
      grants: grants || [],
      donations: donations || [],
    };

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add your Anthropic API key." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert IRS Form 990 preparation assistant for 501(c)(3) nonprofit organizations.
You have deep knowledge of IRS filing requirements, common errors that cause rejections, and best practices.

${formContext}

IMPORTANT RULES:
- Be accurate and conservative with financial figures
- Flag any potential compliance issues
- Never fabricate data - clearly mark suggestions vs. data from the organization's records
- Use "suggested" prefix for any values you're estimating vs. "from_records" for actual data
- Always explain your reasoning
- Format all currency values as numbers (not strings)
- Return valid JSON only`;

    const userMessage = `${sectionPrompt}

Here is the organization's data:
${JSON.stringify(contextData, null, 2)}

Generate the section content as a JSON object. Include a "suggestions" array with any warnings or recommendations.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return new Response(
        JSON.stringify({ error: "AI service error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await anthropicResponse.json();
    const aiText = aiResult.content?.[0]?.text || "";

    let parsed;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: aiText };
    } catch {
      parsed = { raw_response: aiText };
    }

    return new Response(
      JSON.stringify({
        section_key,
        ai_generated: parsed,
        model: aiResult.model,
        usage: aiResult.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
