'use strict';

import conventionalCommitTypes from 'conventional-commit-types';

import { engine } from './engine';

// noinspection JSUnusedGlobalSymbols
export default engine({
    types: conventionalCommitTypes.types,
    defaultType: process.env.CZ_TYPE,
    defaultScope: process.env.CZ_SCOPE,
    defaultSubject: process.env.CZ_SUBJECT,
    defaultBody: process.env.CZ_BODY,
    defaultIssues: process.env.CZ_ISSUES
});
