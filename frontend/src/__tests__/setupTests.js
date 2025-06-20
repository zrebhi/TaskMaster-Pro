// Fix for "TypeError: target.hasPointerCapture is not a function" with Radix UI and user-event
// This is a common issue when using JSDOM (Jest's default test environment)
// which doesn't fully support certain DOM APIs like setPointerCapture.
// Mocking these functions prevents the error during tests.
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = () => false;
}

if (typeof Element.prototype.releasePointerCapture === 'undefined') {
  Element.prototype.releasePointerCapture = () => {};
}