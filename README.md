# checkmoney

[![Scripts sets up by @solid-soda/scripts v2.1.0](https://img.shields.io/static/v1?label=@solid-soda/scripts&message=2.1.0&color=75ddf4)](https://github.com/solid-soda/scripts)

> Simple and powerful money tracker.

Site: https://checkmoney.space

## Development

### Database

You need to have installed [postgres](https://www.postgresql.org) and pass parameters to .env file in back dir.

```sh
yarn

cd back
yarn evolutions:init
yarn evolutions:run
```

### Environment

```sh
cd back
cp .env.dist .env
```

### Start

```sh
cd back
yarn start:back:dev
```

**back running on localhost:3000**

### Commit

```sh
yarn s cz
```
