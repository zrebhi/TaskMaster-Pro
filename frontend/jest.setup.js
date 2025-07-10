// Polyfill TextEncoder and TextDecoder for Jest environment
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock ResizeObserver for components that use it (like Popover from ShadCN/ui)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

window.HTMLElement.prototype.scrollIntoView = jest.fn()

// Polyfill for PointerEvent which is not implemented in JSDOM
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type, params) {
      super(type, params);
      this.pointerId = params.pointerId;
      this.width = params.width;
      this.height = params.height;
      this.pressure = params.pressure;
      this.tangentialPressure = params.tangentialPressure;
      this.tiltX = params.tiltX;
      this.tiltY = params.tiltY;
      this.twist = params.twist;
      this.pointerType = params.pointerType;
      this.isPrimary = params.isPrimary;
    }
  }
  global.PointerEvent = PointerEvent;
}

// Polyfill for hasPointerCapture and releasePointerCapture
window.Element.prototype.hasPointerCapture = () => false;
window.Element.prototype.releasePointerCapture = () => {};
