'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface SetupStatus {
  success: boolean
  message: string
  timestamp?: string
  connection?: {
    authenticated: boolean
    user: string | null
  }
  database?: {
    tables: {
      profiles: boolean
      subscriptions: boolean
      tool_usage: boolean
      daily_limits: boolean
    }
    allTablesExist: boolean
  }
  functions?: {
    can_use_api_tool: boolean
    get_or_create_daily_limit: boolean
    increment_api_usage: boolean
    allFunctionsExist: boolean
  }
  nextSteps?: string[]
  error?: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSetup()
  }, [])

  const checkSetup = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/test-supabase')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check setup')
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = ({ success }: { success: boolean }) => {
    if (success) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    }
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Supabase Setup Status
            </h1>
            <button
              onClick={checkSetup}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh'
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Connection Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading && !status && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {status && (
            <>
              {/* Overall Status */}
              <div
                className={`mb-6 rounded-md p-4 ${
                  status.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex">
                  {status.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />
                  )}
                  <div>
                    <h3
                      className={`text-sm font-medium ${
                        status.success ? 'text-green-800' : 'text-yellow-800'
                      }`}
                    >
                      {status.message}
                    </h3>
                    {status.timestamp && (
                      <p
                        className={`mt-1 text-xs ${
                          status.success ? 'text-green-700' : 'text-yellow-700'
                        }`}
                      >
                        Last checked: {new Date(status.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              {status.connection && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Connection
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <StatusIcon success={true} />
                      <span className="ml-2 text-sm text-gray-700">
                        Connected to Supabase
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StatusIcon success={status.connection.authenticated} />
                      <span className="ml-2 text-sm text-gray-700">
                        {status.connection.authenticated
                          ? `Authenticated as ${status.connection.user}`
                          : 'Not authenticated (this is normal for setup)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Tables */}
              {status.database && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Database Tables
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(status.database.tables).map(([table, exists]) => (
                      <div key={table} className="flex items-center">
                        <StatusIcon success={exists} />
                        <span className="ml-2 text-sm text-gray-700">
                          {table}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Database Functions */}
              {status.functions && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Database Functions
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <StatusIcon success={status.functions.can_use_api_tool} />
                      <span className="ml-2 text-sm text-gray-700">
                        can_use_api_tool
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StatusIcon
                        success={status.functions.get_or_create_daily_limit}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        get_or_create_daily_limit
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StatusIcon success={status.functions.increment_api_usage} />
                      <span className="ml-2 text-sm text-gray-700">
                        increment_api_usage
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {status.nextSteps && status.nextSteps.length > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Next Steps
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {status.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm text-blue-700">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Documentation Links */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Documentation
                </h3>
                <div className="space-y-2">
                  <a
                    href="/supabase/DEPLOYMENT_GUIDE.md"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    → Deployment Guide
                  </a>
                  <a
                    href="/supabase/README.md"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    → Setup Guide
                  </a>
                  <a
                    href="/supabase/QUICK_START.md"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    → Quick Start
                  </a>
                  <a
                    href="https://supabase.com/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:text-blue-800"
                  >
                    → Supabase Documentation ↗
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
