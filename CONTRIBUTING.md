# Contributing to jikkyo

REQUIRED: Node.js >= v6 && yarn

## Getting Started

```sh
git clone https://github.com/rot1024/jikkyo.git
cd jikkyo
yarn
```

## Usage

```sh
yarn start # start dev server and open app
yarn test # test
yarn test-watch # watch tests
yarn run lint # eslint + stylelint
yarn run build # build for production
yarn run start-prod # start app in production mode
yarn run package # package for current OS
yarn run package-all # package for all OS
```

## How to Upgrade Electron

1. Upgrade electron: `yarn upgrade-interactive`
2. Rewrite `"Electron X.X"`, `"electron": X.X` and `"node": X.X` on browserslist in `package.json` and `.babelrc` into latest electron and its node versions
3. Done!

## How to Contribute

1. Fork this repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Create new Pull Request!
