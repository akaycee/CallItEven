# Run All Tests

Run the full test suite for the CallItEven project and report results clearly.

## Steps

1. **Backend Tests**: Navigate to the `backend/` directory and run `npx jest --forceExit --detectOpenHandles --verbose`. There are 13 test suites covering models, middleware, and route integration tests using an in-memory MongoDB.

2. **Frontend Tests**: Navigate to the `frontend/` directory and run `npx react-scripts test --watchAll=false --verbose`. There are 14 test suites covering React component and page tests.

3. **Report Results**: After each suite finishes, summarize:
   - Number of suites passed / failed
   - Number of individual tests passed / failed
   - List any failing test names with the first line of the error message
   - Total time taken

4. **Grand Total**: After both backend and frontend are done, show a combined summary with total tests passed/failed across the entire project (expected: 275 tests, 27 suites).

If any tests fail, clearly highlight which ones failed so they can be investigated. Do not attempt to fix failures automatically — just report them.

$ARGUMENTS
