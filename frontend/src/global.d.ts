import * as React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'adsgram-task': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-block-id'?: string;
        'slot'?: string;
      };
    }
  }
}
