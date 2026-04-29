# zenodo-utils

[![zenodo-utils on npm](https://img.shields.io/npm/v/zenodo-utils.svg)](https://www.npmjs.com/package/zenodo-utils)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/continuous-foundation/zenodo-utils/blob/main/LICENSE)
![CI](https://github.com/continuous-foundation/zenodo-utils/workflows/CI/badge.svg)

Utilities to submit information to [Zenodo](https://zenodo.org) in your application. Works with [MyST Frontmatter](https://mystmd.org) for a single way to define your publishing information for packages and have bulk uploads and deposits for long-term archiving.

```shell
npm install zenodo-utils
```

## Command Line

The library installs a command line interface (CLI) which allows for deposit and upload of content to Zenodo. Deposits require metadata in a `myst.yml` file, including `title`, `authors`, and `abstract`. You may specify the files to be deposited under `downloads`, or the CLI will attempt to discover files in the same folder. You can run the CLI in a folder with a `myst.yml` file, or you can run it in a parent folder, where it will traverse the children and potentially find multiple `myst.yml` files (and therefore create multiple deposits).

You must provide your Zenodo API token as an environment variable `ZENODO_TOKEN`. Basic usage looks like:

```
ZENODO_TOKEN=<my-api-token> zenodo deposit --type presentation --publish
```

Available options for `zenodo deposit` include:

- `--type <type>`: Deposit type (e.g. presentation, poster, publication, dataset, etc)
- `--publish`: Publish deposit immediately when uploads are complete
- `--community <id>`: Add deposit to Zenodo community
- `--sandbox`: Deposit to zenodo sandbox environment

---

<p style="text-align: center; color: #aaa; padding-top: 50px">
  Made with love by
  <a href="https://continuous.foundation" target="_blank" style="color: #aaa">
    Continuous Science Foundation <img src="https://cdn.curvenote.com/static/site/csf/icon.svg" style="height: 1em" />
  </a>
</p>
