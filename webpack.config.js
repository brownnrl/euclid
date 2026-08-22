const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",
  // target: 'node',
  entry: './src/index.ts',
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"],
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
     ".js": [".js", ".ts"],
     ".cjs": [".cjs", ".cts"],
     ".mjs": [".mjs", ".mts"]
    }
  },
  module: {
    rules: [
      // all files with a `.ts`, `.cts`, `.mts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.([cm]?ts|tsx)$/, loader: "ts-loader" }
    ]
  },
  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
      canvas: "commonjs canvas"
  },
  // #142 — emit non-ASCII in string literals as escape sequences.
  //
  // The presentation controls carry glyphs (the nav arrows, the exit mark,
  // the justification separator). A <script src> with no charset of its own
  // is decoded using the INCLUDING document's encoding, so on a consumer
  // page that omits <meta charset> raw UTF-8 in the bundle renders as
  // mojibake and geomlib's own UI breaks — something we cannot fix from the
  // consumer side.
  //
  // Escaping the characters in the TypeScript source does NOT achieve this:
  // tsc decodes the escape and emits the literal character, and the
  // minifier normalises string escapes back to the shortest form. It has to
  // be done at the emit step, which is what ascii_only does.
  optimization: {
    minimizer: [
      (compiler) => {
        const TerserPlugin = require('terser-webpack-plugin');
        new TerserPlugin({
          terserOptions: { format: { ascii_only: true } },
        }).apply(compiler);
      },
    ],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'geomlib'
  },
};
