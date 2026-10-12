
# my website

## run locally

### build

prerequisites:
+ node
+ make or npm
+ tsc (if no npm)

#### npm
```sh
npm install # install typescript compiler
npm run build
```

#### make <3
benefits:
- incremental

```sh
# NODE=node \
# TSC=node_modules/.bin/tsc \
# DIST=dist \
make build
```

this will populate `./dist/` with `styles.css`, `index.js`, and `index.html` (which imports the first two)

