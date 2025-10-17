# Testing Quick Start Guide

This guide will help you quickly set up and run tests for PromptEasy.

## Prerequisites

Before running tests, ensure you have:

1. ✅ Node.js 20+ installed
2. ✅ pnpm installed (`npm install -g pnpm`)
3. ✅ PostgreSQL running locally
4. ✅ Dependencies installed (`pnpm install`)

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Test Database

```bash
# Create test database
createdb prompteasy_test

# Run migrations
DATABASE_URL="postgresql://youruser:yourpass@localhost:5432/prompteasy_test" pnpm db:push
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with your local settings:

```env
DATABASE_URL="postgresql://youruser:yourpass@localhost:5432/prompteasy_test"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-here"
```

## Running Tests

### Unit Tests Only (Fast - ~30 seconds)

```bash
pnpm test
```

This runs all Jest unit tests including:
- Utility functions
- React components
- AI service
- tRPC routers

### E2E Tests Only (Slower - ~2-5 minutes)

```bash
# First, make sure your dev server is running
pnpm dev

# In another terminal:
pnpm test:e2e
```

Or let Playwright start the server automatically:

```bash
pnpm test:e2e
```

### All Tests

```bash
pnpm test:all
```

## Development Workflow

### While Developing

Use watch mode for instant feedback:

```bash
pnpm test:watch
```

This will re-run tests automatically when you save files.

### Before Committing

Run the full test suite:

```bash
# 1. Run linter
pnpm lint

# 2. Run unit tests with coverage
pnpm test:coverage

# 3. Run E2E tests
pnpm test:e2e
```

Or use the combined command:

```bash
pnpm test:all
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm test:e2e:ui` | Run E2E tests with UI (interactive) |
| `pnpm test:e2e:headed` | Run E2E tests in browser (visible) |
| `pnpm test:e2e:debug` | Debug E2E tests step-by-step |
| `pnpm test:all` | Run all tests (unit + E2E) |

## Running Specific Tests

### Run a specific test file:

```bash
pnpm test src/lib/__tests__/utils.test.ts
```

### Run a specific test suite:

```bash
pnpm test -t "TokenCounter"
```

### Run E2E test for a specific feature:

```bash
pnpm test:e2e tests/e2e/auth.spec.ts
```

## Debugging Tests

### Debug Unit Tests

Add `debugger` statements and run:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Debug E2E Tests

Use the interactive debugger:

```bash
pnpm test:e2e:debug
```

This will pause test execution and allow you to step through.

### View E2E Tests Running

Watch tests execute in the browser:

```bash
pnpm test:e2e:headed
```

## Common Issues & Solutions

### Issue: Database connection fails

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Create test database if it doesn't exist
createdb prompteasy_test

# Verify connection string in .env.test
```

### Issue: Tests timeout

**Solution:**
```bash
# Increase timeout for specific test
test('slow test', async () => {
  // ...
}, 30000); // 30 second timeout

# Or in playwright.config.ts, increase global timeout
```

### Issue: E2E tests fail with "page not found"

**Solution:**
```bash
# Ensure dev server is running on port 3000
pnpm dev

# Or let Playwright handle it automatically (default)
```

### Issue: Tests pass locally but fail in CI

**Solution:**
- Check that all environment variables are set in CI
- Ensure database migrations are run in CI
- Check for race conditions or timing issues

## Test Coverage

View coverage report after running:

```bash
pnpm test:coverage
```

Coverage report will be in `coverage/lcov-report/index.html`

Open it in your browser:

```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every push to `main` branch
- Before deployments

CI runs:
1. ✅ Linting
2. ✅ Type checking
3. ✅ Unit tests with coverage
4. ✅ E2E tests
5. ✅ Build verification

## Next Steps

- 📚 Read the full [Testing Guide](./tests/README.md)
- 🔍 Explore existing tests in `src/**/__tests__/` and `tests/e2e/`
- ✍️ Write tests for new features
- 🚀 Set up pre-commit hooks (optional)

## Getting Help

- **Documentation**: See `tests/README.md` for detailed testing documentation
- **Examples**: Look at existing tests for reference
- **Jest Docs**: https://jestjs.io/
- **Playwright Docs**: https://playwright.dev/
- **React Testing Library**: https://testing-library.com/react

## Best Practices Checklist

- [ ] Write tests alongside new features
- [ ] Maintain >80% code coverage
- [ ] Test edge cases and error scenarios
- [ ] Use meaningful test descriptions
- [ ] Keep tests isolated and independent
- [ ] Clean up test data after tests
- [ ] Mock external services (AI APIs, etc.)
- [ ] Run tests before committing

Happy Testing! 🎉
