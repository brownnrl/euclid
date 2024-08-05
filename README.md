				# Installation Instructions

Install typescript

```sh
$ npm install --save-dev typescript
```

```sh
npx tsc
```

```sh
$ npm install --save-dev ts-loader webpack webpack-cli
```

Install types and mocha

```sh
$ npm install --save-dev @types/mocha @types/node
```


Finally, install remaining dependencies. (maybe not this)

```sh
$ node install --save-dev
```

Now, you can compile which may require first compiling results in ./src

```sh
$ cd ./src
$ tsc
$ cd ..
$ tsc
```

You should now be able to run compiled tests.

```sh
$ npm test
```

Finally, you can run webpack.

```sh
$ npx webpack
```

A sample view HTML file uses the bundle.js file generated in the dist folder.  You can view this by using a development server.  I tend to use a python server.

```sh
$ python3 -m http.server
```

And navigate to `http://locahost:(port)/view/index.html` where port is that reported in the console. 
