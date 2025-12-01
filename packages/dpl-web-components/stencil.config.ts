import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';

export const config: Config = {
  namespace: 'dpl-web-components',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
    angularOutputTarget({
      componentCorePackage: '@dpl/web-components',
      directivesProxyFile: '../dpl-angular/src/directives/stencil-generated.ts',
      directivesArrayFile: '../dpl-angular/src/directives/index.ts',
    }),
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
