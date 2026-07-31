# 🐛 Bug Directory - Index & Status

**Last Updated:** July 31, 2026  
**Total Bugs:** 9 documented

---

## 📋 Bug Index (Serial Number Order)

| ID | Title | Severity | Status | File |
|----|-------|----------|--------|------|
| **BUG-001** | Instance Visibility - Wrong Status Filter | 🔴 Critical | Open | [BUG-001-instance-visibility.md](BUG-001-instance-visibility.md) |
| **BUG-002** | Inconsistent Status Filtering Across Controllers | 🟡 High | Open | [BUG-002-status-inconsistency.md](BUG-002-status-inconsistency.md) |
| **BUG-003** | Model Method Missing Status Parameter Validation | 🟡 Medium | Open | [BUG-003-model-status-defaults.md](BUG-003-model-status-defaults.md) |
| **BUG-004** | Widget Method Hardcoded Status Filter | 🟡 Medium | Open | [BUG-004-widget-status-filter.md](BUG-004-widget-status-filter.md) |
| **BUG-005** | No Status Code Constants Defined | 🟢 Low | Open | [BUG-005-no-status-constants.md](BUG-005-no-status-constants.md) |
| **BUG-006** | Instance Not Loading in Engine & Linked Number Missing | 🔴 Critical | Fixed | [BUG-006-instance-not-loading-in-engine.md](BUG-006-instance-not-loading-in-engine.md) |
| **BUG-007** | CodeIgniter Table Prefix Mismatch (500 Transaction Error) | 🔴 Critical | Fixed | [BUG-007-codeigniter-table-prefix-mismatch.md](BUG-007-codeigniter-table-prefix-mismatch.md) |
| **BUG-008** | Live Status Stuck ("Waiting for live server status...") | 🟡 Medium | Fixed | [BUG-008-live-status-group-forward.md](BUG-008-live-status-group-forward.md) |
| **BUG-009** | Web Server Conflict (Routed Error 404) | 🔴 Critical | Fixed | [BUG-009-nginx-apache-conflict.md](BUG-009-nginx-apache-conflict.md) |
| **BUG-010** | Campaign Group ID String Format Issue | 🔴 Critical | Fixed | [BUG-010-campaign-group-id-format.md](BUG-010-campaign-group-id-format.md) |
| **BUG-011** | Campaign Delay Hardcapped for Group Forwarding | 🟡 High | Fixed | [BUG-011-campaign-delay-limit.md](BUG-011-campaign-delay-limit.md) |
| **BUG-012** | Parallel Campaign Execution Delay & Queue Logic | 🔴 Critical | Fixed | [BUG-012-parallel-campaign-execution-delay.md](BUG-012-parallel-campaign-execution-delay.md) |

---

## 🔍 Bug Categories

### By Component
- **PHP Backend:** BUG-001, BUG-002, BUG-003, BUG-004, BUG-005
- **Node.js Engine:** BUG-006
- **Database:** BUG-006
- **Mobile App:** (None currently documented)

### By Severity
- **🔴 Critical:** BUG-001, BUG-006
- **🟡 High:** BUG-002
- **🟡 Medium:** BUG-003, BUG-004
- **🟢 Low:** BUG-005

### By Module
- **Whatsapp_profiles:** BUG-001, BUG-002
- **Account_manager:** BUG-003, BUG-004
- **Core System:** BUG-005

---

## 🎯 Priority Fix Order

### Immediate Priority (Critical)
1. **BUG-001** - Instances hidden from mobile due to wrong status filter
   - Impact: Mobile app cannot see any active instances
   - Blocks: All mobile operations

### High Priority
2. **BUG-002** - Status inconsistency causes confusion
   - Impact: Different modules show different instances
   - Blocks: Reliable instance listing

### Medium Priority
3. **BUG-003** - Model defaults wrong status
4. **BUG-004** - Widgets show inactive accounts

### Low Priority
5. **BUG-005** - No constants (refactoring improvement)

---

## 📊 Bug Statistics

**Open:** 5  
**In Progress:** 0  
**Fixed:** 1  
**Verified:** 1  

**By Impact:**
- Blocks mobile app: 1
- Causes data inconsistency: 3
- Code quality issue: 1

---

## 🔄 Bug Workflow

```
[Open] → [In Progress] → [Fixed] → [Verified] → [Closed]
```

**Status Definitions:**
- **Open:** Bug documented, not started
- **In Progress:** Currently being fixed
- **Fixed:** Code changed, awaiting verification
- **Verified:** Fix tested and confirmed
- **Closed:** Fully resolved and deployed

---

## 📝 How to Use This Directory

### For AI Agents:

1. **Finding Bugs by Symptom:**
   - Mobile can't see instances → BUG-001
   - Different modules show different data → BUG-002
   - Model returns wrong accounts → BUG-003

2. **Reading Bug Files:**
   Each bug file contains:
   - Exact file path and line number
   - Code snippet showing the problem
   - Explanation of impact
   - Step-by-step fix instructions
   - Test cases to verify fix

3. **Implementing Fixes:**
   - Open specific BUG-XXX file
   - Follow "Fix Steps" section
   - Run tests in "Verification" section
   - Update bug status in this README

### For Developers:

1. Check this README for overview
2. Open specific bug file for details
3. Make changes as per fix instructions
4. Update status field when done
5. Add verification notes

---

## 🆕 Adding New Bugs

**Next Serial Number:** BUG-007

**Template:**
```markdown
# BUG-XXX: [Short Title]

**Serial Number:** BUG-XXX  
**Severity:** Critical/High/Medium/Low  
**Status:** Open  
**Component:** [PHP/Node/Mobile]  
**Module:** [Specific module name]  

## Location
- **File:** [Path]
- **Line:** [Number]
- **Function:** [Name]

## Description
[What's wrong]

## Impact
[What breaks]

## Steps to Reproduce
1. Step 1
2. Step 2

## Fix Steps
1. Fix 1
2. Fix 2

## Verification
[How to test]
```

---

## 🔗 Related Documentation

- [Architecture Overview](../01-ARCHITECTURE/01-system-overview.md)
- [Code Locations](../04-CODE-LOCATIONS/01-php-controllers.md)
- [Troubleshooting Guide](../08-TROUBLESHOOTING/01-common-errors.md)

---

**Maintained by:** AI Documentation System  
**Review Frequency:** After each bug fix
