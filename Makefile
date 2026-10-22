NODE ?= node
TSC ?= node_modules/.bin/tsc
DIST ?= dist
SRC ?= src
STATIC ?= static

# select typescript files (.ts) without selecting typescript definition files (.d.ts)
TS_SOURCES := $(filter-out %.d.ts,$(wildcard ${SRC}/*.ts))


## commands (mirroring package.json scripts)

build: ${DIST}
build-app: ${SRC}/main.js
build-static: ${DIST}/index.js
run: ${DIST}/index.html


## increments

${DIST}: ${DIST}/styles.css ${DIST}/index.js ${SRC}/main.js ${STATIC}/index.template.html
	IN=${STATIC}/index.template.html OUT=$@ node src/main.js # build website to dist/

${DIST}/styles.css: ${STATIC}/styles.css
	mkdir -p dist
	cp $< $@ # copy styles.css to dist/

${DIST}/index.js: ${STATIC}/index.js
	mkdir -p dist
	cp $< $@ # copy compiled index.js to dist/

${STATIC}/index.js: ${STATIC}/index.ts tsconfig.static.json
	${TSC} -p tsconfig.static.json

${SRC}/main.js: ${TS_SOURCES} ${SRC}/*.tsx tsconfig.json
	${TSC} -p tsconfig.json

clean:
	rm -rf ${DIST}
	rm -f ${SRC}/*.js
	rm -f ${SRC}/*.js.map
	rm -f ${SRC}/*.d.ts
	rm -f ${SRC}/*.d.ts.map
	rm -f ${STATIC}/*.js
	rm -f ${STATIC}/*.js.map
	rm -f ${STATIC}/*.d.ts
	rm -f ${STATIC}/*.d.ts.map
