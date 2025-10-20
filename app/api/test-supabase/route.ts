import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test API route to verify Supabase connection and configuration
 * GET /api/test-supabase
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Database connection
    const { data: profilesCount, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          details: countError.message,
        },
        { status: 500 }
      )
    }
    
    // Test 2: Auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Auth session check failed',
          details: sessionError.message,
        },
        { status: 500 }
      )
    }
    
    // Test 3: Database function (if user is authenticated)
    let canUseApiTool = null
    if (session?.user) {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('can_use_api_tool', { p_user_id: session.user.id })
      
      if (!functionError) {
        canUseApiTool = functionResult
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tests: {
        database: {
          status: 'connected',
          profilesTableAccessible: true,
        },
        auth: {
          status: 'configured',
          hasActiveSession: !!session,
          userEmail: session?.user?.email || null,
        },
        functions: {
          status: session ? 'tested' : 'skipped (no session)',
          canUseApiTool: canUseApiTool,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error during Supabase test',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
