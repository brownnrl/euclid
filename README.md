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


# Euclid Applet Docker Environment

This Docker setup runs a preserved Java 8 environment for exploring classic geometry applets such as David Joyce's "Euler Line".

## How to Use

1. **Build the images (once):**
   ```
   docker build -f Containerfile         -t euclid-applet:latest  .
   docker build -f Containerfile.firefox -t euclid-firefox:latest .
   ```
   The first image (`euclid-applet`) provides Java 8 + appletviewer for the
   two appletviewer windows. The second (`euclid-firefox`) provides firefox
   for the third comparison window in `./run_euclid_applet.sh`. Both share
   the `ubuntu:20.04` base layer so the second build is small.

2. **Ensure X11 is running on your Linux host.**
   - If needed, allow Docker to access X:
     ```
     xhost +local:docker
     ```

3. **Run the applet container:** `./start_java8_container.sh`

3. **Inside the container:**
- Navigate to the applet directory:
  ```
  cd /usr/src/app/view
  appletviewer   -J-Djava.security.manager   -J-Djava.security.policy=/usr/src/app/view/permissive.policy   -J-Djava.security.debug=all   eulerline.html
  ```

## Notes

- This setup uses Java 8 and includes the required `.class` and `.zip` files.
- You must be on Linux with X11 for GUI windows to appear.
- You can modify the container and re-commit changes using: `docker commit <container_id> euclid-applet:latest`
