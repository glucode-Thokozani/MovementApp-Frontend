import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// Register this loader hook
register(import.meta.url, pathToFileURL('./'));

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'react-native') {
    return {
      shortCircuit: true,
      url: new URL('../src/features/health/__mocks__/react-native.ts', import.meta.url).href,
    };
  }

  // Handle extensionless relative / absolute imports for TypeScript
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const parentURL = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const parentDir = path.dirname(parentURL);
    const resolvedPath = path.resolve(parentDir, specifier);

    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      return nextResolve(specifier, context);
    }

    const extensions = ['.ts', '.tsx', '.js', '/index.ts', '/index.js'];
    for (const ext of extensions) {
      const candidate = resolvedPath + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return {
          shortCircuit: true,
          url: pathToFileURL(candidate).href,
        };
      }
    }
  }

  return nextResolve(specifier, context);
}
