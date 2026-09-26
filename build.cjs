// Resolve only inside this project, including in restricted Windows workspaces.
const path = require('node:path');
const fs = require('node:fs/promises');
const esbuild = require('esbuild');
const root = __dirname;
const localResolver = () => ({ name: 'local-project', setup(build) {
    build.onResolve({ filter: /.*/ }, args => {
      let resolved;
      if (args.kind === 'entry-point') resolved = path.resolve(root, args.path);
      else if (args.path === 'three') resolved = path.join(root, 'node_modules/three/build/three.module.js');
      else if (args.path.startsWith('three/')) resolved = path.join(root, 'node_modules', args.path);
      else if (args.path.startsWith('.')) resolved = path.resolve(path.dirname(args.importer), args.path);
      else throw new Error(`Unsupported dependency: ${args.path}`);
      if (!resolved.startsWith(root + path.sep)) throw new Error('Dependency outside project');
      return { path: resolved, namespace: 'project-js' };
    });
    build.onLoad({ filter: /.*/, namespace: 'project-js' }, async args => ({
      contents: await fs.readFile(args.path, 'utf8'), loader: 'js'
    }));
  }});
const common = {
  absWorkingDir: root, bundle: true, minify: true, format: 'iife', target: 'es2020', logLevel: 'info'
};
Promise.all([
  esbuild.build({
    ...common, entryPoints: ['src/pitwall3d.js'], // src/car3d.js (F1 study) is no longer on the page
    outdir: path.join(root, 'dist'), plugins: [localResolver()]
  }),
  esbuild.build({
    ...common, entryPoints: ['src/opening-sequence.mjs'],
    outfile: path.join(root, 'dist/opening-sequence.js'), globalName: 'OpeningSequence', plugins: [localResolver()]
  })
]).catch(() => process.exit(1));
