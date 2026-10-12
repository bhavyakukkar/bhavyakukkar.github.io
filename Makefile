NODE ?= node
TSC ?= node_modules/.bin/tsc
DIST ?= dist
SRC ?= src
STATIC ?= static

# select typescript files (.ts) without selecting typescript definition files (.d.ts)
TS_SOURCES := $(filter-out %.d.ts,$(wildcard ${SRC}/*.ts))

# commands (mirroring package.json scripts)
build: ${DIST}/index.html ${DIST}/styles.css ${DIST}/index.js
build-app: ${SRC}/main.js
build-static: ${DIST}/index.js
run: ${DIST}/index.html
pack: ${DIST}/styles.css ${DIST}/index.html

${DIST}/index.html: ${SRC}/main.js ${STATIC}/index.template.html
	mkdir -p ${DIST}
	IN=${STATIC}/index.template.html OUT=$@ ${NODE} $<

${DIST}/styles.css: ${STATIC}/styles.css
	mkdir -p ${DIST}
	cp $< $@

${DIST}/index.js: ${STATIC}/index.ts tsconfig.static.json
	mkdir -p ${DIST}
	${TSC} -p tsconfig.static.json

${SRC}/main.js: ${TS_SOURCES} ${SRC}/*.tsx tsconfig.json
	${TSC} -p tsconfig.json

clean:
	rm -r ${DIST}
	rm src/*.js
	rm src/*.js.map
	rm src/*.d.ts
	rm src/*.d.ts.map
