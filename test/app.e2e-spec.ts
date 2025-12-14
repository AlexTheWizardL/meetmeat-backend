/**
 * App-level e2e tests.
 * These tests require a running database, so they should be run
 * in a proper test environment with DATABASE_* env vars configured.
 *
 * For module-specific e2e tests (profiles, events, etc.), see the
 * individual test files which use mocked repositories.
 */

describe('App (e2e)', () => {
  it.skip('should be run with proper database configuration', () => {
    // This test is skipped by default.
    // To run full integration tests, configure DATABASE_* env vars
    // and remove the .skip
    expect(true).toBe(true);
  });
});
