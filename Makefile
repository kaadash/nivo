SOURCES = packages

.PHONY: help bootstrap init packages-build packages-publish clean-all website-install website website-build website-deploy storybook storybook-build storybook-deploy deploy-all examples-install

########################################################################################################################
#
# HELP
#
########################################################################################################################

# COLORS
RED    = $(shell printf "\33[31m")
GREEN  = $(shell printf "\33[32m")
WHITE  = $(shell printf "\33[37m")
YELLOW = $(shell printf "\33[33m")
RESET  = $(shell printf "\33[0m")

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
# A category can be added with @category
HELP_HELPER = \
    %help; \
    while(<>) { push @{$$help{$$2 // 'options'}}, [$$1, $$3] if /^([a-zA-Z\-\%]+)\s*:.*\#\#(?:@([0-9]+\s[a-zA-Z\-\%_]+))?\s(.*)$$/ }; \
    print "usage: make [target]\n\n"; \
    for (sort keys %help) { \
    print "${WHITE}$$_:${RESET}\n"; \
    for (@{$$help{$$_}}) { \
    $$sep = " " x (32 - length $$_->[0]); \
    print "  ${YELLOW}$$_->[0]${RESET}$$sep${GREEN}$$_->[1]${RESET}\n"; \
    }; \
    print "\n"; }

help: ##prints help
	@perl -e '$(HELP_HELPER)' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

########################################################################################################################
#
# GLOBAL
#
########################################################################################################################

bootstrap: ##@0 global lerna bootstrap
	@./node_modules/.bin/lerna bootstrap

init: ##@0-global cleanup/install/bootstrap
	@make clean-all
	@yarn install
	@make bootstrap
	@make packages-build
	@make website-install
	@make examples-install

fmt: ##@0 global format code using prettier (js, css, md)
	@./node_modules/.bin/prettier --color --write \
		"packages/*/{src,stories,tests}/**/*.js" \
		"packages/*/README.md" \
		"website/src/**/*.{js,css}" \
		"examples/*/src/**/*.{js,css}" \
		"README.md"

deploy-all: ##@0-global deploy website & storybook
	@make website-deploy
	@make storybook-deploy

clean-all: ##@0 global uninstall node modules, remove transpiled code & lock files
	@rm -rf node_modules
	@rm -rf package-lock.json
	@$(foreach source, $(SOURCES), $(call clean-source-all, $(source)))
	@rm -rf website/node_modules
	@rm -rf website/package-lock.json

define clean-source-lib
	rm -rf $(1)/*/es
	rm -rf $(1)/*/lib
endef

define clean-source-all
	rm -rf $(1)/*/es
	rm -rf $(1)/*/lib
	rm -rf $(1)/*/node_modules
	rm -rf $(1)/*/package-lock.json
endef

########################################################################################################################
#
# PACKAGES
#
########################################################################################################################

packages-lint: ##@1 packages run eslint on packages
	@echo "${YELLOW}Running eslint on all packages${RESET}"
	@./node_modules/.bin/lerna run lint

packages-test: ##@1 packages run tests for all packages
	# stream can be used for a mire verbose output
	#@./node_modules/.bin/lerna run --concurrency 1 --stream test
	@./node_modules/.bin/lerna run --concurrency 1 test

packages-build: ##@1 packages build all packages
	@echo "${YELLOW}Building all packages${RESET}"
	@$(foreach source, $(SOURCES), $(call clean-source-lib, $(source)))
	@./node_modules/.bin/lerna run build

packages-screenshots: ##@1 packages generate screenshots for packages readme (website dev server must be running)
	@node scripts/capture.js

packages-publish: ##@1 packages publish all packages
	@make packages-build

	@echo "${YELLOW}Publishing packages${RESET}"
	@./node_modules/.bin/lerna publish ---exact

package-build-watch-%: ##@1 packages build package (es flavor) on change, eg. `package-build-watch-bar`
	@echo "${YELLOW}Running build watcher for package ${WHITE}${*}${RESET}"
	@cd packages/nivo-${*} && yarn build:es:watch

package-build-%: ##@1 packages build package (all flavors), eg. `package-build-bar`
	@echo "${YELLOW}Build package ${WHITE}${*}${RESET}"
	@cd packages/nivo-${*} && yarn build

package-dev-%: ##@1 packages setup package for development, link to website, run watcher
	@echo "${YELLOW}Preparing package ${WHITE}${*}${YELLOW} for development${RESET}"
	@cd packages/nivo-${*} && yarn link
	@cd website && yarn link @nivo/${*}
	@make package-build-watch-${*}

########################################################################################################################
#
# WEBSITE
#
########################################################################################################################

website-install: ##@2 website install website dependencies
	@echo "${YELLOW}Installing website dependencies${RESET}"
	@cd website && yarn install

website: ##@2 website start website in dev mode
	@echo "${YELLOW}Starting website dev server${RESET}"
	@cd website && yarn start

website-build: ##@2 website build website
	@echo "${YELLOW}Building website${RESET}"
	@cd website && yarn build

website-deploy: ##@2 website build & deploy website
	@make website-build

	@echo "${YELLOW}Deploying website${RESET}"
	@./node_modules/.bin/gh-pages -d website/build -r git@github.com:plouc/nivo.git -b gh-pages

website-audit: ##@2 website audit website build
	@cd website && yarn analyze

website-links-ls: ##@2 website list linked packages
	@echo "${YELLOW}Which packages are currently being linked to ${WHITE}website${YELLOW}?${RESET}"
	@cd website; \
    find node_modules node_modules/\@* -depth 1 -type l -print | awk -F/ '{print $$(NF)}' | while read MODULE; do \
        echo "> linked package: ${WHITE}$${MODULE}${RESET}"; \
    done

website-links-rm: ##@2 website unlink all linked packages
	@echo "${YELLOW}Unlinking all packages for ${WHITE}website${RESET}"
	@cd website; \
    find node_modules node_modules/\@* -depth 1 -type l -print | awk -F/ '{print $$(NF)}' | while read MODULE; do \
        yarn unlink "@nivo/$${MODULE}"; \
    done
	@make website-install

########################################################################################################################
#
# STORYBOOK
#
########################################################################################################################

storybook: ##@3 storybook start storybook in dev mode on port 6006
	@./node_modules/.bin/start-storybook -p 6006

storybook-build: ##@3 storybook build storybook
	@echo "${YELLOW}Building storybook${RESET}"
	@./node_modules/.bin/build-storybook

storybook-deploy: ##@3 storybook build and deploy storybook
	@make storybook-build

	@echo "${YELLOW}Deploying storybook${RESET}"
	@./node_modules/.bin/gh-pages -d storybook-static -r git@github.com:plouc/nivo.git -b gh-pages -e storybook

########################################################################################################################
#
# EXAMPLES
#
########################################################################################################################

examples-install: ##@4 examples install all examples dependencies
	@make example-install-retro

example-install-%: ##@4 examples install example dependencies, eg. example-install-retro
	@echo "${YELLOW}Installing ${WHITE}${*}${YELLOW} example dependencies${RESET}"
	@cd examples/${*} && yarn install

example-start-%: ##@4 examples start example in dev mode, eg. example-start-retro
	@echo "${YELLOW}Starting ${WHITE}${*}${YELLOW} example dev server${RESET}"
	@cd examples/${*} && yarn start

examples-build: ##@4 examples build all examples
	@make example-build-retro

example-build-%: ##@4 examples build an example, eg. example-build-retro
	@echo "${YELLOW}Building ${WHITE}${*}${YELLOW} example${RESET}"
	@cd examples/${*} && yarn build
