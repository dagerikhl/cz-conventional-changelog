'format cjs';

var engine = require('./engine');
var conventionalCommitTypes = require('conventional-commit-types');

var commitlint = undefined;
try {
  // Assume this folder is in top-level node_modules and that commitlint config is in project root
  commitlint = require('../../commitlint.config.js');
} catch (ex) {}

module.exports = engine({
  types: conventionalCommitTypes.types,
  defaultType: process.env.CZ_TYPE,
  scopes: commitlint ? commitlint.rules['scope-enum'][2] : undefined,
  defaultScope: process.env.CZ_SCOPE,
  defaultSubject: process.env.CZ_SUBJECT,
  defaultBody: process.env.CZ_BODY,
  defaultIssues: process.env.CZ_ISSUES
});
