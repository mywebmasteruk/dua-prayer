# CI references

`makerkit-workflow.yml` is Makerkit’s upstream GitHub Actions workflow.
It lives here (not under `.github/workflows`) so pushes work with standard
`repo` OAuth scopes. To enable Makerkit’s CI checks, copy it to
`.github/workflows/workflow.yml` using a token with the `workflow` scope.
