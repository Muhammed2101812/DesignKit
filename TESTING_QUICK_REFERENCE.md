# Manual Testing Quick Reference Card

## 🚀 Quick Start

```bash
# 1. Verify setup
npx tsx scripts/pre-test-check.ts

# 2. Start dev server
npm run dev

# 3. Open browser
http://localhost:3000
```

## 📋 Testing Documents

| Document | Purpose |
|----------|---------|
| `TESTING_GUIDE.md` | Step-by-step testing instructions |
| `MANUAL_TESTING_CHECKLIST.md` | Comprehensive checklist to track progress |
| `TEST_REPORT_TEMPLATE.md` | Professional report template |
| `TASK_21.4_MANUAL_TESTING.md` | Complete implementation details |

## 🌐 Browser Testing

### Desktop Browsers
- **Chrome**: Latest version
- **Firefox**: Latest version
- **Safari**: macOS only
- **Edge**: Latest version

### Mobile Browsers
- **iOS Safari**: iPhone/iPad
- **Android Chrome**: Android device

## ⌨️ Keyboard Shortcuts to Test

| Key | Action |
|-----|--------|
| `Tab` | Move focus forward |
| `Shift + Tab` | Move focus backward |
| `Enter` | Activate button/link |
| `Space` | Activate button/checkbox |
| `Escape` | Close modal/menu |
| `+` | Zoom in (Color Picker) |
| `-` | Zoom out (Color Picker) |
| `0` | Reset zoom (Color Picker) |

## 📱 Responsive Breakpoints

| Size | Device | Width |
|------|--------|-------|
| Small Mobile | iPhone SE | 320px |
| Mobile | iPhone 12 | 375px |
| Large Mobile | iPhone Pro Max | 414px |
| Tablet | iPad | 768px |
| Desktop | Laptop | 1024px |
| Large Desktop | Monitor | 1920px |

## ♿ Screen Reader Commands

### NVDA (Windows)
- Start: `Ctrl + Alt + N`
- Next element: `Down Arrow`
- Previous element: `Up Arrow`
- Next heading: `H`
- Next link: `K`
- Next button: `B`

### VoiceOver (macOS)
- Start: `Cmd + F5`
- Next element: `VO + Right Arrow`
- Previous element: `VO + Left Arrow`
- Next heading: `VO + Cmd + H`
- Rotor: `VO + U`

## 🧪 Critical Test Scenarios

### Color Picker Workflow
1. Upload image (drag & drop)
2. Click to pick color
3. Copy HEX value
4. Verify clipboard
5. Pick 10 colors
6. Export palette
7. Clear history
8. Reset image

### Authentication Flow
1. Sign up with email
2. Verify email
3. Login
4. View profile
5. Update profile
6. Logout

### Error Testing
1. Upload file > 10MB
2. Upload invalid file type
3. Submit empty form
4. Enter invalid email
5. Test network offline

## 🎯 Priority Test Areas

### Must Test
- ✅ Color Picker core functionality
- ✅ File upload (drag & drop)
- ✅ Color extraction and display
- ✅ Copy to clipboard
- ✅ Mobile responsiveness
- ✅ Keyboard navigation
- ✅ Error messages

### Should Test
- ✅ Authentication flows
- ✅ Profile management
- ✅ Dark mode
- ✅ Screen reader
- ✅ Performance
- ✅ Cross-browser

### Nice to Test
- ✅ Edge cases
- ✅ Animations
- ✅ Loading states
- ✅ Tooltips

## 🐛 Common Issues Checklist

- [ ] Layout shifts during load
- [ ] Horizontal scrolling on mobile
- [ ] Missing focus indicators
- [ ] Poor color contrast
- [ ] Broken images
- [ ] Console errors
- [ ] Slow loading
- [ ] Memory leaks
- [ ] Clipboard failures
- [ ] Touch target too small

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |
| Color Extraction | < 100ms |

## 🔒 Security Checks

- [ ] Images processed client-side only
- [ ] No server upload in Network tab
- [ ] Session storage (not local)
- [ ] Data cleared on logout
- [ ] HTTPS in production
- [ ] No sensitive data in console

## 📝 Issue Severity

| Level | Description | Example |
|-------|-------------|---------|
| **P0 Critical** | Blocks functionality | App crashes, cannot upload |
| **P1 Major** | Significant impact | Feature broken, poor UX |
| **P2 Minor** | Cosmetic/edge case | Visual glitch, typo |

## 🎨 WCAG AA Requirements

- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard accessible
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Form labels present
- [ ] Error messages clear
- [ ] Heading hierarchy logical

## 🔧 DevTools Tips

### Chrome DevTools
- Open: `F12` or `Ctrl + Shift + I`
- Device mode: `Ctrl + Shift + M`
- Console: `Ctrl + Shift + J`
- Network: Check "Disable cache"
- Performance: Record page load

### Lighthouse Audit
1. Open DevTools
2. Go to Lighthouse tab
3. Select categories
4. Click "Generate report"
5. Review scores and suggestions

## 📞 Getting Help

### Resources
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- NVDA Guide: https://www.nvaccess.org/files/nvda/documentation/userGuide.html
- Can I Use: https://caniuse.com/

### Questions?
1. Check browser console for errors
2. Review requirements.md
3. Consult design.md
4. Ask development team

## ✅ Daily Testing Checklist

### Morning Setup
- [ ] Pull latest code
- [ ] Run pre-test check
- [ ] Start dev server
- [ ] Clear browser cache
- [ ] Prepare test images

### During Testing
- [ ] Follow checklist systematically
- [ ] Take screenshots of issues
- [ ] Document steps to reproduce
- [ ] Note browser/device details
- [ ] Check console for errors

### End of Day
- [ ] Update test checklist
- [ ] Log all issues found
- [ ] Back up test data
- [ ] Share progress with team
- [ ] Plan next day's testing

## 🎯 Testing Goals

**Day 1**: Browser compatibility + Core functionality
**Day 2**: Mobile + Accessibility
**Day 3**: Edge cases + Performance
**Day 4**: Final review + Sign-off

---

**Print this card and keep it handy during testing!** 📄
