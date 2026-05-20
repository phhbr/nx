import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { readmeInterfacesGenerator } from './helperScripts/readme-interfaces-generator';

export const config: Config = {
  namespace: 'dpl-web-components',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      dir: 'components',
      customElementsExportBehavior: 'single-export-module',
      minify: true,
      externalRuntime: false,
      copy: [{
        src: '../helperScripts/custom-elements',
        dest: 'components',
        warn: true
      }],
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'custom',
      name: 'interfaces readme',
      generator: readmeInterfacesGenerator
    },
    {
      type: 'www',
      serviceWorker: null,
    },
    angularOutputTarget({
      componentCorePackage: '@designsystem/dpl-web-components',
      outputType: 'standalone',
      directivesProxyFile: '../dpl-angular/src/lib/standalone/components.ts',
    }),
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
