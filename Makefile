test:
	eslint ./

firefox:
	web-ext sign --source-dir ./ --ignore-files .travis.yml preview.gif Readme.md .gitignore .git .eslintignore .eslintrc.json Makefile .DS_Store

build: firefox
