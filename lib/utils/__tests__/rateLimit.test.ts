import { NextRequest } from 'next/server'
import {
  checkRateLimit,
  rateLimit,
  getRateLimitConfig,
  resetRateLimit,
  getRateLimitStatus,
  clearAllRateLimits,
  RATE_LIMIT_CONFIGS,
} from '../rateLimit'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

describe('rateLimit', () => {
  beforeEach(() => {
    // Clear rate limits before each test
    clearAllRateLimits()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      const result1 = await checkRateLimit('test-user', config)
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = await checkRateLimit('test-user', config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('should block requests exceeding limit', async () => {
      const config = {
        maxRequests: 3,
        windowSeconds: 60,
      }

      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit('test-user', config)
        expect(result.success).toBe(true)
      }

      // 4th request should fail
      const result = await checkRateLimit('test-user', config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 1, // 1 second window
      }

      // Use up the limit
      await checkRateLimit('test-user', config)
      await checkRateLimit('test-user', config)

      const result1 = await checkRateLimit('test-user', config)
      expect(result1.success).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))
      
      const result2 = await checkRateLimit('test-user', config)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)
    }, 2000)

    it('should track different identifiers separately', async () => {
      const config = {
        maxRequests: 2,
        windowSeconds: 60,
      }

      await checkRateLimit('user1', config)
      await checkRateLimit('user1', config)
      const result1 = await checkRateLimit('user1', config)
      expect(result1.success).toBe(false)

      // user2 should have separate limit
      const result2 = await checkRateLimit('user2', config)
      expect(result2.success).toBe(true)
    })
  })

  describe('rateLimit middleware', () => {
    it('should allow requests within limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const result = await rateLimit(request, {
        maxRequests: 5,
        windowSeconds: 60,
      })

      expect(result.success).toBe(true)
      expect(result.response).toBeUndefined()
    })

    it('should return error response when limit exceeded', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // First request should succeed
      const result1 = await rateLimit(request, config)
      expect(result1.success).toBe(true)

      // Second request should fail
      const result2 = await rateLimit(request, config)
      expect(result2.success).toBe(false)
      expect(result2.response).toBeDefined()

      const json = await result2.response!.json()
      expect(json.error).toBeDefined()
      expect(result2.response!.status).toBe(429)
    })

    it('should include rate limit headers in error response', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Use up the limit
      await rateLimit(request, config)

      // Get error response
      const result = await rateLimit(request, config)
      expect(result.response).toBeDefined()

      const headers = result.response!.headers
      expect(headers.get('X-RateLimit-Limit')).toBe('1')
      expect(headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(headers.get('X-RateLimit-Reset')).toBeDefined()
      expect(headers.get('Retry-After')).toBe('60')
    })

    it('should use custom identifier function', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const config = {
        maxRequests: 2,
        windowSeconds: 60,
        identifier: async () => 'custom-id',
      }

      const result1 = await rateLimit(request, config)
      expect(result1.success).toBe(true)

      const result2 = await rateLimit(request, config)
      expect(result2.success).toBe(true)

      const result3 = await rateLimit(request, config)
      expect(result3.success).toBe(false)
    })
  })

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have configs for all user tiers', () => {
      expect(RATE_LIMIT_CONFIGS.guest).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.free).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.premium).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.pro).toBeDefined()
      expect(RATE_LIMIT_CONFIGS.strict).toBeDefined()
    })

    it('should have increasing limits for higher tiers', () => {
      expect(RATE_LIMIT_CONFIGS.guest.maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS.free.maxRequests
      )
      expect(RATE_LIMIT_CONFIGS.free.maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS.premium.maxRequests
      )
      expect(RATE_LIMIT_CONFIGS.premium.maxRequests).toBeLessThan(
        RATE_LIMIT_CONFIGS.pro.maxRequests
      )
    })
  })

  describe('getRateLimitConfig', () => {
    it('should return correct config for each plan', () => {
      expect(getRateLimitConfig('guest')).toEqual(RATE_LIMIT_CONFIGS.guest)
      expect(getRateLimitConfig('free')).toEqual(RATE_LIMIT_CONFIGS.free)
      expect(getRateLimitConfig('premium')).toEqual(RATE_LIMIT_CONFIGS.premium)
      expect(getRateLimitConfig('pro')).toEqual(RATE_LIMIT_CONFIGS.pro)
      expect(getRateLimitConfig('strict')).toEqual(RATE_LIMIT_CONFIGS.strict)
    })
  })

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', async () => {
      const config = {
        maxRequests: 1,
        windowSeconds: 60,
      }

      // Use up the limit
      await checkRateLimit('test-user', config)
      const result1 = await checkRateLimit('test-user', config)
      expect(result1.success).toBe(false)

      // Reset
      resetRateLimit('test-user')

      // Should be able to make requests again
      const result2 = await checkRateLimit('test-user', config)
      expect(result2.success).toBe(true)
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return current status', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      await checkRateLimit('test-user', config)
      await checkRateLimit('test-user', config)

      const status = getRateLimitStatus('test-user', config)
      expect(status).toBeDefined()
      expect(status!.remaining).toBe(3)
      expect(status!.limit).toBe(5)
    })

    it('should return null for unknown identifier', () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      const status = getRateLimitStatus('unknown-user', config)
      expect(status).toBeNull()
    })

    it('should return null for expired window', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 1,
      }

      await checkRateLimit('test-user', config)

      await new Promise((resolve) => setTimeout(resolve, 1100))
      
      const status = getRateLimitStatus('test-user', config)
      expect(status).toBeNull()
    }, 2000)
  })

  describe('clearAllRateLimits', () => {
    it('should clear all rate limit data', async () => {
      const config = {
        maxRequests: 5,
        windowSeconds: 60,
      }

      await checkRateLimit('user1', config)
      await checkRateLimit('user2', config)
      await checkRateLimit('user3', config)

      clearAllRateLimits()

      expect(getRateLimitStatus('user1', config)).toBeNull()
      expect(getRateLimitStatus('user2', config)).toBeNull()
      expect(getRateLimitStatus('user3', config)).toBeNull()
    })
  })
})
