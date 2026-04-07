import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Intrinsic elements generic definitions
      [elemName: string]: any;
    }
  }
}
