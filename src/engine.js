'use strict';

import map from 'lodash.map';
import longest from 'longest';
import rightPad from 'right-pad';
import wrap from 'word-wrap';

const filterExisting = (array) => array.filter((x) => x);

export const engine = (options) => {
    const types = options.types;
    const length = longest(Object.keys(types)).length + 1;
    const choices = map(types, (type, key) => ({
        name: rightPad(key + ':', length) + ' ' + type.description,
        value: key
    }));

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
                    when: (answers) => answers.isBreaking
                }, {
                    type: 'confirm',
                    name: 'isIssueAffected',
                    message: 'Does this change affect any open issues?',
                    default: !!options.defaultIssues
                }, {
                    type: 'input',
                    name: 'issues',
                    message: 'Add issue references (e.g. "fix #123", "re #123".):\n',
                    when: (answers) => answers.isIssueAffected,
                    default: options.defaultIssues ? options.defaultIssues : undefined
                }
            ]).then((answers) => {
                const maxLineWidth = 100;
                const wrapOptions = {
                    trim: true,
                    newline: '\n',
                    indent: '',
                    width: maxLineWidth
                };

                // parentheses are only needed when a scope is present
                let scope = answers.scope.trim();
                scope = scope ? `(${answers.scope.trim()})` : '';

                // Hard limit this line
                const head = `${answers.type}${scope}: ${answers.subject.trim()}`.slice(0, maxLineWidth);

                // Wrap these lines at 100 characters
                const body = wrap(answers.body, wrapOptions);

                // Apply breaking change prefix, removing it if already present
                let breaking = answers.breaking ? answers.breaking.trim() : '';
                breaking = breaking ? `BREAKING CHANGE: ${breaking.replace(/^BREAKING CHANGE: /, '')}` : '';
                breaking = wrap(breaking, wrapOptions);

                const issues = answers.issues ? wrap(answers.issues, wrapOptions) : '';

                const footer = filterExisting([breaking, issues]).join('\n\n');

                commit(head + '\n\n' + body + '\n\n' + footer);
            });
        }
    };
};
