'use strict';

import map from 'lodash.map';
import longest from 'longest';
import rightPad from 'right-pad';
import wrap from 'word-wrap';

const filterExisting = (array) => array.filter((x) => x);

export const engine = (options) => {
    const types = options.types;
    // noinspection JSUnresolvedVariable
    const length = longest(Object.keys(types)).length + 1;
    const choices = map(types, (type, key) => ({
        name: `${rightPad(`${key}:`, length)} ${type.description}`,
        value: key
    }));

    // noinspection JSUnusedGlobalSymbols
    return {
        prompter: (cz, commit) => {
            console.log(
                '\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

            cz.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: 'Select the type of change that you\'re committing:',
                    choices: choices,
                    default: options.defaultType
                }, {
                    type: 'input',
                    name: 'scope',
                    message: 'What is the scope of this change (e.g. component or file name)? (press enter to skip)\n',
                    default: options.defaultScope
                }, {
                    type: 'input',
                    name: 'subject',
                    message: 'Write a short, imperative tense description of the change:\n',
                    default: options.defaultSubject
                }, {
                    type: 'input',
                    name: 'body',
                    message: 'Provide a longer description of the change: (press enter to skip)\n',
                    default: options.defaultBody
                }, {
                    type: 'confirm',
                    name: 'isBreaking',
                    message: 'Are there any breaking changes?',
                    default: false
                }, {
                    type: 'input',
                    name: 'breaking',
                    message: 'Describe the breaking changes:\n',
                    when: ({ isBreaking }) => isBreaking
                }, {
                    type: 'confirm',
                    name: 'isIssueAffected',
                    message: 'Does this change affect any open issues?',
                    default: !!options.defaultIssues
                }, {
                    type: 'input',
                    name: 'issues',
                    message: 'Add issue references (e.g. "fix #123", "re #123".):\n',
                    when: ({ isIssueAffected }) => isIssueAffected,
                    default: options.defaultIssues ? options.defaultIssues : undefined
                }
            ]).then(({ scope, type, subject, body, breaking, issues }) => {
                const maxLineWidth = 100;
                const wrapOptions = {
                    trim: true,
                    newline: '\n',
                    indent: '',
                    width: maxLineWidth
                };

                // parentheses are only needed when a scope is present
                let scopeString = scope.trim();
                scopeString = scopeString ? `(${scope.trim()})` : '';

                // Hard limit this line
                const head = `${type}${scopeString}: ${subject.trim()}`.slice(0, maxLineWidth);

                // Wrap these lines at 100 characters
                const bodyString = wrap(body, wrapOptions);

                // Apply breaking change prefix, removing it if already present
                let breakingString = breaking ? breaking.trim() : '';
                breakingString =
                    breakingString ? `BREAKING CHANGE: ${breakingString.replace(/^BREAKING CHANGE: /, '')}` : '';
                breakingString = wrap(breakingString, wrapOptions);

                const issuesString = issues ? wrap(issues, wrapOptions) : '';

                const footer = filterExisting([breakingString, issuesString]).join('\n\n');

                commit(head + '\n\n' + bodyString + '\n\n' + footer);
            });
        }
    };
};
