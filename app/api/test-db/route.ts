import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test API route to verify Supabase connection
 * GET /api/test-db
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Basic connection
    const { data: profileCount, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: countError.message 
        },
        { status: 500 }
      )
    }
    
    // Test 2: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Test 3: Check if tables exist
    const tables = ['profiles', 'subscriptions', 'tool_usage', 'daily_limits'] as const
    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        const { error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
        return { table, exists: !error }
      })
    )
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        authenticated: !!user,
        user: user ? { id: user.id, email: user.email } : null,
        tables: tableChecks,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Unexpected error during database test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
