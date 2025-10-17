# Testing Guide

This document provides an overview of the testing strategy and how to run tests for PromptEasy.

## Testing Stack

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **Test Database**: PostgreSQL (test database)

## Project Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── fixtures/          # Playwright fixtures and helpers
│   │   └── auth.ts       # Authentication fixtures
│   ├── auth.spec.ts      # Authentication flow tests
│   ├── prompts.spec.ts   # Prompt management tests
│   └── editor.spec.ts    # Editor interface tests
└── README.md             # This file

src/
├── lib/__tests__/         # Library utility tests
│   ├── utils.test.ts     # Utils tests
│   └── ai-service.test.ts # AI service tests
├── components/
│   ├── editor/__tests__/  # Editor component tests
│   │   └── TokenCounter.test.tsx
│   ├── prompts/__tests__/ # Prompt component tests
│   │   └── PromptList.test.tsx
│   └── tags/__tests__/    # Tag component tests
│       └── TagDialog.test.tsx
└── server/api/
    ├── __tests__/        # API test utilities
    │   └── test-utils.ts
    └── routers/__tests__/ # Router tests
        ├── prompt.test.ts
        ├── folder.test.ts
        └── tag.test.ts
```

## Running Tests

### Unit Tests

Run all unit tests:
```bash
pnpm test
```

Run tests in watch mode (for development):
```bash
pnpm test:watch
```

Run tests with coverage:
```bash
pnpm test:coverage
```

Run specific test file:
```bash
pnpm test src/lib/__tests__/utils.test.ts
```

### E2E Tests

Run all E2E tests:
```bash
pnpm test:e2e
```

Run E2E tests with UI (interactive mode):
```bash
pnpm test:e2e:ui
```

Run E2E tests in headed mode (see the browser):
```bash
pnpm test:e2e:headed
```

Debug E2E tests:
```bash
pnpm test:e2e:debug
```

Run specific E2E test file:
```bash
pnpm test:e2e tests/e2e/auth.spec.ts
```

### Run All Tests

Run both unit and E2E tests:
```bash
pnpm test:all
```

## Test Environment Setup

### Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database for E2E tests
2. **Environment Variables**: Create a `.env.test` file with test credentials

### Environment Variables

Create a `.env.test` file in the project root:

```env
# Database
DATABASE_URL="postgresql://test:test@localhost:5432/prompteasy_test"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-change-in-production"

# AI Services (use test keys or mock)
OPENAI_API_KEY="sk-test-key"
ANTHROPIC_API_KEY="test-key"

# OAuth (optional for E2E tests)
GOOGLE_CLIENT_ID="test-client-id"
GOOGLE_CLIENT_SECRET="test-client-secret"
```

### Database Setup for E2E Tests

1. Create a test database:
```bash
createdb prompteasy_test
```

2. Run migrations:
```bash
DATABASE_URL="postgresql://test:test@localhost:5432/prompteasy_test" pnpm db:migrate
```

3. (Optional) Seed test data:
```bash
DATABASE_URL="postgresql://test:test@localhost:5432/prompteasy_test" pnpm db:seed
```

## Writing Tests

### Unit Tests Example

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### E2E Tests Example

```typescript
import { test, expect } from './fixtures/auth';

test.describe('Feature Name', () => {
  test('should perform action', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/page');
    await authenticatedPage.click('button:has-text("Click Me")');
    await expect(authenticatedPage.locator('text=Success')).toBeVisible();
  });
});
```

## Test Coverage

Current test coverage:

- **Unit Tests**:
  - ✅ Utilities (`lib/utils.ts`)
  - ✅ AI Service (`lib/ai-service.ts`)
  - ✅ Token Counter component
  - ✅ Prompt List component
  - ✅ Tag Dialog component
  - ✅ tRPC routers (prompt, folder, tag)

- **E2E Tests**:
  - ✅ Authentication (register, login, logout, session)
  - ✅ Prompt Management (CRUD, search, filters)
  - ✅ Folders (create, filter)
  - ✅ Tags (create, filter)
  - ✅ Editor (edit, save, variables, versions)
  - ✅ Testing Interface
  - ✅ AI Improvement

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests complete
3. **Mocking**: Mock external services (AI APIs, OAuth) in unit tests
4. **Realistic**: E2E tests should simulate real user interactions
5. **Assertions**: Use meaningful assertions that verify actual functionality
6. **Error Cases**: Test both success and error scenarios

## Continuous Integration

Tests are run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

### CI Configuration

The CI pipeline runs:
1. Linting
2. Type checking
3. Unit tests with coverage
4. E2E tests (on staging environment)
5. Build verification

## Troubleshooting

### Common Issues

**Issue**: E2E tests fail with database connection error
- **Solution**: Ensure PostgreSQL is running and test database exists

**Issue**: Tests timeout
- **Solution**: Increase timeout in test configuration or check for performance issues

**Issue**: Tests pass locally but fail in CI
- **Solution**: Check environment variables and ensure CI has same setup

**Issue**: Mock not working in Jest
- **Solution**: Ensure mocks are defined before imports using `jest.mock()`

### Debug Tips

1. **Jest**: Use `console.log()` or add `--verbose` flag
2. **Playwright**: Use `--debug` flag to step through tests
3. **Screenshots**: Playwright automatically takes screenshots on failure
4. **Traces**: Enable trace recording for detailed debugging

## Updating Tests

When adding new features:

1. Write unit tests for new utilities/services
2. Write component tests for new React components
3. Write E2E tests for new user flows
4. Update this README if test structure changes

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
