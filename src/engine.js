'use strict';

import map from 'lodash.map';
import longest from 'longest';
import rightPad from 'right-pad';
import wrap from 'word-wrap';

const MAX_SUBJECT_LINE_LENGTH = 72;
const MAX_LINE_WIDTH = 100;

const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: MAX_LINE_WIDTH
};
const wrapLine = (message) => wrap(message, wrapOptions);

const print = (message) => console.log(`[CZ] ${message}\n`);

const required = (message) => `${message}:\n`;
const optional = (message) => `${message}: (press ENTER to skip)\n`;
const question = (message) => `${message}?`;

const generateScope = (scope) => scope.trim() ? `(${scope.trim()})` : '';
const generateSubjectLine = (type, scope, description) => `${type}${generateScope(scope)}: ${description.trim()}`;

export const engine = (options) => {
    // noinspection JSUnresolvedVariable
    const length = longest(Object.keys(options.types)).length + 1;
    const choices = map(options.types, (type, key) => ({
        name: `${rightPad(`${key}:`, length)} ${type.description}`,
        value: key
    }));

    // noinspection JSUnusedGlobalSymbols
    return {
        prompter: (cz, commit) => {
            print(`Subject line will be forced to ${MAX_SUBJECT_LINE_LENGTH} characters.` +
                ` All other lines will be wrapped at ${MAX_LINE_WIDTH} characters.`);

            cz.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: required('Select the type of change that you\'re committing'),
                    choices: choices,
                    default: options.defaultType
                }, {
                    type: 'input',
                    name: 'scope',
                    message: optional('Type the scope of this change (e.g. one component or one file name)'),
                    default: options.defaultScope,
                    validate: (input) => {
                        input = input.trim();

                        if (/[A-Z]/.test(input)) {
                            return 'The scope must be lowercase.';
                        }

                        if (!/^[a-z09]*$/.test(input)) {
                            return 'You can only provide one scope.';
                        }

                        return true;
                    }
                }, {
                    type: 'input',
                    name: 'subject',
                    message: required('Write a short, imperative tense, description, starting lowercase.' +
                        ` Max ${MAX_SUBJECT_LINE_LENGTH} characters for the subject line, "type(scope): description"`),
                    default: options.defaultSubject,
                    validate: (input, answers) => {
                        input = input.trim();

                        if (input.length === 0) {
                            return 'You must provide a description.';
                        }

                        if (!/^[a-z]/.test(input)) {
                            return 'The description must begin with a lowercase character.';
                        }

                        const subjectLine = generateSubjectLine(answers.type, answers.scope, input);
                        if (subjectLine.length > MAX_SUBJECT_LINE_LENGTH) {
                            return 'The entire subject line, "type(scope): description",' +
                                ` can not exceed ${MAX_SUBJECT_LINE_LENGTH} characters.`;
                        }

                        return true;
                    }
                }, {
                    type: 'input',
                    name: 'body',
                    message: optional('Provide a longer description of the change'),
                    default: options.defaultBody
                }, {
                    type: 'confirm',
                    name: 'isBreaking',
                    message: question('Are there any breaking changes'),
                    default: false
                }, {
                    type: 'input',
                    name: 'breaking',
                    message: required('Describe the breaking changes'),
                    when: ({ isBreaking }) => isBreaking
                }, {
                    type: 'confirm',
                    name: 'isIssueAffected',
                    message: question('Does this change affect any open issues'),
                    default: !!options.defaultIssues
                }, {
                    type: 'input',
                    name: 'issues',
                    message: required('Add issue references (e.g. "fix #123", "re #123")'),
                    when: ({ isIssueAffected }) => isIssueAffected,
                    default: options.defaultIssues ? options.defaultIssues : undefined
                }
            ]).then(({ type, scope, subject, body, isBreaking, breaking, isIssues, issues }) => {
                // Generate the subject line on the form "type(scope): description"
                const subjectLineString = generateSubjectLine(type, scope, subject);

                // Wrap the lines of the body text to its max
                const bodyString = body.trim() ? wrapLine(body.trim()) : '';
                const breakingString = isBreaking && breaking.trim()
                    ? wrapLine(`BREAKING CHANGE: ${breaking.trim()}`)
                    : '';
                const issuesString = isIssues && issues.trim() ? wrapLine(issues.trim()) : '';

                const footer = `${breakingString}${(breakingString && issuesString) ? '\n\n' : ''}${issuesString}`;

                commit(`${subjectLineString}\n\n${bodyString}${footer ? '\n\n' : ''}${footer}`);
            });
        }
    };
};
