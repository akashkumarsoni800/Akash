import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    const { email, password, full_name, role, school_id, subject, phone } = payload

    if (!email || !school_id) {
       throw new Error("Missing essential parameters: email or school_id");
    }

    // 1. Check if user already exists in auth
    const { data: { user: existingUser }, error: fetchError } = await supabaseClient.auth.admin.getUserByEmail(email)
    
    let user = existingUser

    if (!user) {
      // 2. Create user if they don't exist
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password: password || 'Teacher@123',
        email_confirm: true,
        user_metadata: { full_name, role }
      })
      if (createError) throw createError
      user = newUser.user
    }

    // 3. Upsert into target table (teachers)
    const { error: dbError } = await supabaseClient
      .from('teachers')
      .upsert({
        id: user.id,
        full_name: full_name || 'New Faculty',
        email: email,
        phone: phone || '',
        role: role || 'teacher',
        school_id: school_id,
        subject: subject || 'General'
      }, { onConflict: 'id,school_id' })

    if (dbError) {
      if (dbError.code === '23505') {
        throw new Error(`This identity (${email}) is already globally synchronized. Staff may belong to only one institution.`);
      }
      throw dbError
    }

    return new Response(JSON.stringify({ 
        success: true, 
        user_id: user.id,
        message: "Identity synchronized successfully across institutional nodes." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
