#!/usr/bin/env tsx

/**
 * Production Verification Script
 * 
 * This script verifies that the deployed production application
 * is functioning correctly by testing critical endpoints and functionality.
 * 
 * Usage:
 *   npx tsx scripts/verify-production.ts https://your-domain.com
 */

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bold')
  console.log('='.repeat(60))
}

function logCheck(name: string, status: 'pass' | 'fail' | 'warn', message?: string) {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠'
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow'
  log(`${icon} ${name}${message ? `: ${message}` : ''}`, color)
}

interface CheckResult {
  passed: number
  failed: number
  warnings: number
  errors: string[]
}

async function checkPageLoad(url: string, pageName: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (response.ok) {
      logCheck(pageName, 'pass', `${response.status} ${response.statusText}`)
      return true
    } else {
      logCheck(pageName, 'fail', `${response.status} ${response.statusText}`)
      return false
    }
  } catch (error) {
    logCheck(pageName, 'fail', `${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

async function checkHTTPS(url: string): Promise<boolean> {
  if (url.startsWith('https://')) {
    logCheck('HTTPS Enforcement', 'pass', 'Using HTTPS')
    return true
  } else {
    logCheck('HTTPS Enforcement', 'fail', 'Not using HTTPS')
    return false
  }
}

async function checkSecurityHeaders(url: string): Promise<CheckResult> {
  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  try {
    const response = await fetch(url)
    const headers = response.headers

    // Check for security headers
    const securityHeaders = [
      { name: 'X-Frame-Options', required: false },
      { name: 'X-Content-Type-Options', required: false },
      { name: 'Strict-Transport-Security', required: true },
      { name: 'Content-Security-Policy', required: false },
    ]

    for (const header of securityHeaders) {
      if (headers.has(header.name.toLowerCase())) {
        logCheck(header.name, 'pass', headers.get(header.name.toLowerCase()) || '')
        result.passed++
      } else if (header.required) {
        logCheck(header.name, 'fail', 'Missing')
        result.failed++
        result.errors.push(`${header.name} header is missing`)
      } else {
        logCheck(header.name, 'warn', 'Not set (recommended)')
        result.warnings++
      }
    }
  } catch (error) {
    logCheck('Security Headers', 'fail', `${error instanceof Error ? error.message : 'Unknown error'}`)
    result.failed++
    result.errors.push('Failed to check security headers')
  }

  return result
}

async function checkPages(baseUrl: string): Promise<CheckResult> {
  logSection('🌐 Page Availability')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  const pages = [
    { path: '/', name: 'Landing Page' },
    { path: '/color-picker', name: 'Color Picker Tool' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/pricing', name: 'Pricing Page' },
    { path: '/tools', name: 'Tools Grid' },
  ]

  for (const page of pages) {
    const success = await checkPageLoad(`${baseUrl}${page.path}`, page.name)
    if (success) {
      result.passed++
    } else {
      result.failed++
      result.errors.push(`${page.name} failed to load`)
    }
  }

  return result
}

async function checkSecurity(baseUrl: string): Promise<CheckResult> {
  logSection('🔒 Security Checks')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  // Check HTTPS
  const httpsOk = await checkHTTPS(baseUrl)
  if (httpsOk) {
    result.passed++
  } else {
    result.failed++
    result.errors.push('HTTPS is not enforced')
  }

  // Check security headers
  log('\nSecurity Headers:', 'cyan')
  const headersResult = await checkSecurityHeaders(baseUrl)
  result.passed += headersResult.passed
  result.failed += headersResult.failed
  result.warnings += headersResult.warnings
  result.errors.push(...headersResult.errors)

  return result
}

async function checkPerformance(baseUrl: string): Promise<CheckResult> {
  logSection('⚡ Performance Checks')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  try {
    const startTime = Date.now()
    const response = await fetch(baseUrl)
    const endTime = Date.now()
    const loadTime = endTime - startTime

    // Check response time
    if (loadTime < 1500) {
      logCheck('Response Time', 'pass', `${loadTime}ms (< 1500ms)`)
      result.passed++
    } else if (loadTime < 3000) {
      logCheck('Response Time', 'warn', `${loadTime}ms (target: < 1500ms)`)
      result.warnings++
    } else {
      logCheck('Response Time', 'fail', `${loadTime}ms (too slow)`)
      result.failed++
      result.errors.push(`Response time ${loadTime}ms exceeds 3000ms`)
    }

    // Check content size
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      const sizeKB = parseInt(contentLength) / 1024
      if (sizeKB < 500) {
        logCheck('Page Size', 'pass', `${sizeKB.toFixed(2)} KB`)
        result.passed++
      } else {
        logCheck('Page Size', 'warn', `${sizeKB.toFixed(2)} KB (consider optimization)`)
        result.warnings++
      }
    }

    // Check compression
    const encoding = response.headers.get('content-encoding')
    if (encoding && (encoding.includes('gzip') || encoding.includes('br'))) {
      logCheck('Compression', 'pass', encoding)
      result.passed++
    } else {
      logCheck('Compression', 'warn', 'Not detected (recommended)')
      result.warnings++
    }
  } catch (error) {
    logCheck('Performance Check', 'fail', `${error instanceof Error ? error.message : 'Unknown error'}`)
    result.failed++
    result.errors.push('Failed to check performance')
  }

  return result
}

async function checkAPI(baseUrl: string): Promise<CheckResult> {
  logSection('🔌 API Endpoints')

  const result: CheckResult = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  }

  // Note: Most API endpoints require authentication
  // We'll just check if they're accessible (not 404)
  
  log('\nNote: API endpoints require authentication, checking accessibility only', 'cyan')
  
  const endpoints = [
    { path: '/api/test-db', name: 'Database Test API' },
    { path: '/api/test-supabase', name: 'Supabase Test API' },
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`)
      // We expect 401 (unauthorized) or 200, not 404
      if (response.status === 404) {
        logCheck(endpoint.name, 'fail', '404 Not Found')
        result.failed++
        result.errors.push(`${endpoint.name} returned 404`)
      } else {
        logCheck(endpoint.name, 'pass', `${response.status} (endpoint exists)`)
        result.passed++
      }
    } catch (error) {
      logCheck(endpoint.name, 'warn', `${error instanceof Error ? error.message : 'Unknown error'}`)
      result.warnings++
    }
  }

  return result
}

function printSummary(
  pagesResult: CheckResult,
  securityResult: CheckResult,
  performanceResult: CheckResult,
  apiResult: CheckResult
) {
  logSection('📊 Summary')

  const totalPassed = pagesResult.passed + securityResult.passed + performanceResult.passed + apiResult.passed
  const totalFailed = pagesResult.failed + securityResult.failed + performanceResult.failed + apiResult.failed
  const totalWarnings = pagesResult.warnings + securityResult.warnings + performanceResult.warnings + apiResult.warnings

  console.log('')
  log(`✓ Passed:   ${totalPassed}`, 'green')
  log(`✗ Failed:   ${totalFailed}`, 'red')
  log(`⚠ Warnings: ${totalWarnings}`, 'yellow')

  const allErrors = [
    ...pagesResult.errors,
    ...securityResult.errors,
    ...performanceResult.errors,
    ...apiResult.errors,
  ]

  if (allErrors.length > 0) {
    logSection('❌ Errors Found')
    allErrors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'red')
    })
  }

  console.log('\n' + '='.repeat(60))

  if (totalFailed > 0) {
    log('\n❌ PRODUCTION VERIFICATION FAILED', 'red')
    log('Please fix the errors above.', 'red')
    process.exit(1)
  } else if (totalWarnings > 0) {
    log('\n⚠️  PRODUCTION VERIFICATION PASSED WITH WARNINGS', 'yellow')
    log('Review the warnings above for optimization opportunities.', 'yellow')
    process.exit(0)
  } else {
    log('\n✅ PRODUCTION VERIFICATION PASSED', 'green')
    log('All checks passed! Your application is running correctly.', 'green')
    process.exit(0)
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    log('\n❌ Error: No URL provided', 'red')
    log('\nUsage: npx tsx scripts/verify-production.ts https://your-domain.com', 'cyan')
    log('\nExample: npx tsx scripts/verify-production.ts https://design-kit-xxx.pages.dev', 'cyan')
    process.exit(1)
  }

  let baseUrl = args[0]
  
  // Remove trailing slash
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }

  // Validate URL
  try {
    new URL(baseUrl)
  } catch (error) {
    log('\n❌ Error: Invalid URL', 'red')
    log(`Provided: ${baseUrl}`, 'red')
    log('\nPlease provide a valid URL starting with http:// or https://', 'cyan')
    process.exit(1)
  }

  log('\n🎨 Design Kit - Production Verification', 'bold')
  log(`Testing: ${baseUrl}\n`, 'cyan')

  const pagesResult = await checkPages(baseUrl)
  const securityResult = await checkSecurity(baseUrl)
  const performanceResult = await checkPerformance(baseUrl)
  const apiResult = await checkAPI(baseUrl)

  printSummary(pagesResult, securityResult, performanceResult, apiResult)
}

main()
