# Network Performance Testing Guide

This guide explains how to test API-powered tools under various network conditions to ensure they perform well for all users.

## Testing Network Conditions

### 1. Chrome DevTools Network Throttling

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Click on "No throttling" dropdown
4. Select a preset or create custom profile

**Recommended Test Profiles:**

| Profile | Download | Upload | Latency | Use Case |
|---------|----------|--------|---------|----------|
| Fast 3G | 1.6 Mbps | 750 Kbps | 562.5ms | Mobile users |
| Slow 3G | 400 Kbps | 400 Kbps | 2000ms | Poor connectivity |
| 4G | 4 Mbps | 3 Mbps | 170ms | Average mobile |
| WiFi | 30 Mbps | 15 Mbps | 28ms | Good connection |

### 2. Testing API Tools

#### Background Remover
**Expected Performance:**
- Fast 3G: 8-12 seconds for 5MB image
- Slow 3G: 20-30 seconds for 5MB image
- 4G: 5-8 seconds for 5MB image
- WiFi: 3-5 seconds for 5MB image

**Test Steps:**
1. Navigate to `/tools/background-remover`
2. Enable network throttling
3. Upload a 5MB test image
4. Measure time from upload to result display
5. Verify progress indicators work correctly
6. Test cancel functionality during upload

#### Image Upscaler
**Expected Performance:**
- Fast 3G: 15-25 seconds for 2x upscale
- Slow 3G: 40-60 seconds for 2x upscale
- 4G: 10-15 seconds for 2x upscale
- WiFi: 5-10 seconds for 2x upscale

**Test Steps:**
1. Navigate to `/tools/image-upscaler`
2. Enable network throttling
3. Upload a test image and select 2x scale
4. Measure total processing time
5. Verify polling mechanism works correctly
6. Test timeout handling (if processing takes > 60s)

### 3. Performance Metrics to Track

#### Upload Performance
- **Time to First Byte (TTFB):** < 500ms on WiFi
- **Upload Progress:** Updates every 100ms
- **Upload Completion:** Feedback within 200ms

#### Processing Performance
- **Status Updates:** Every 2 seconds during processing
- **Progress Indication:** Visual feedback throughout
- **Error Detection:** Within 5 seconds of failure

#### Download Performance
- **Download Start:** < 200ms after processing complete
- **Download Progress:** For files > 5MB
- **Download Complete:** Success feedback within 200ms

### 4. Testing Checklist

#### Before Upload
- [ ] Tool loads within 2 seconds
- [ ] UI is responsive and interactive
- [ ] File uploader is ready to accept files
- [ ] Quota indicator displays correctly

#### During Upload
- [ ] Progress bar updates smoothly
- [ ] Upload percentage displays accurately
- [ ] Cancel button is functional
- [ ] UI remains responsive

#### During Processing
- [ ] Processing overlay displays immediately
- [ ] Status messages update regularly
- [ ] Progress indicator animates smoothly
- [ ] Cancel option works (if supported)

#### After Processing
- [ ] Result displays within 500ms
- [ ] Download button is enabled
- [ ] Quota updates correctly
- [ ] Success message displays

#### Error Scenarios
- [ ] Network timeout handled gracefully
- [ ] API errors display clear messages
- [ ] Retry option is available
- [ ] Quota not decremented on error

### 5. Automated Network Testing Script

```typescript
// scripts/test-network-performance.ts
import puppeteer from 'puppeteer'

async function testNetworkPerformance() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  // Simulate Fast 3G
  const client = await page.target().createCDPSession()
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps in bytes/s
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps in bytes/s
    latency: 562.5, // ms
  })
  
  // Navigate to tool
  await page.goto('http://localhost:3000/tools/background-remover')
  
  // Upload file and measure time
  const startTime = Date.now()
  const fileInput = await page.$('input[type="file"]')
  await fileInput.uploadFile('./test-images/sample-5mb.jpg')
  
  // Wait for processing to complete
  await page.waitForSelector('[data-testid="download-button"]', {
    timeout: 60000,
  })
  
  const duration = Date.now() - startTime
  console.log(`Processing completed in ${duration}ms`)
  
  await browser.close()
}
```

### 6. Performance Optimization Strategies

#### For Slow Networks
1. **Compress uploads:** Use client-side compression before upload
2. **Chunked uploads:** Break large files into smaller chunks
3. **Resume capability:** Allow resuming interrupted uploads
4. **Optimistic UI:** Show immediate feedback before server response

#### For High Latency
1. **Reduce round trips:** Batch API calls where possible
2. **Prefetch resources:** Load assets before they're needed
3. **Cache aggressively:** Store results in sessionStorage
4. **Parallel requests:** Don't wait for sequential operations

#### For Unreliable Connections
1. **Retry logic:** Automatic retry with exponential backoff
2. **Timeout handling:** Clear timeouts and error messages
3. **Offline detection:** Detect and notify when offline
4. **Queue operations:** Queue requests when offline, send when online

### 7. Real-World Testing

#### Test Locations
- **Coffee shop WiFi:** Shared, variable bandwidth
- **Mobile hotspot:** Cellular data connection
- **Home WiFi:** Typical residential connection
- **Office network:** Corporate network with firewall

#### Test Devices
- **Desktop:** Chrome, Firefox, Safari, Edge
- **Mobile:** iOS Safari, Android Chrome
- **Tablet:** iPad Safari, Android Chrome

#### Test Scenarios
1. **Peak hours:** Test during high traffic times
2. **Multiple tabs:** Test with multiple tool tabs open
3. **Background apps:** Test with other apps using bandwidth
4. **VPN connection:** Test through VPN for added latency

### 8. Monitoring and Alerts

#### Key Metrics to Monitor
- **Average upload time:** Track by file size
- **Processing success rate:** % of successful operations
- **Error rate:** % of failed operations
- **Timeout rate:** % of operations that timeout
- **Retry rate:** % of operations that require retry

#### Alert Thresholds
- Upload time > 30s for 5MB file
- Processing success rate < 95%
- Error rate > 5%
- Timeout rate > 2%

### 9. Performance Budget

| Metric | Target | Maximum |
|--------|--------|---------|
| Upload time (5MB, WiFi) | 2s | 5s |
| Upload time (5MB, 4G) | 5s | 10s |
| Processing time (background removal) | 3s | 8s |
| Processing time (upscaling 2x) | 5s | 15s |
| Time to first status update | 1s | 2s |
| Status update frequency | 2s | 5s |

### 10. Continuous Monitoring

#### Synthetic Monitoring
- Run automated tests every hour
- Test from multiple geographic locations
- Alert on performance degradation
- Track trends over time

#### Real User Monitoring (RUM)
- Collect performance data from actual users
- Track by network type (WiFi, 4G, 3G)
- Identify slow regions or ISPs
- Correlate with user satisfaction

## Conclusion

Network performance testing is crucial for API-powered tools. By testing under various network conditions and implementing appropriate optimizations, we ensure a good experience for all users regardless of their connection quality.

**Remember:**
- Test regularly under different conditions
- Monitor real-world performance
- Optimize for the slowest supported connection
- Provide clear feedback during slow operations
- Handle errors gracefully with retry options
