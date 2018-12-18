"format cjs";

var wrap = require('word-wrap');
var map = require('lodash.map');
var longest = require('longest');
var rightPad = require('right-pad');

var filter = function(array) {
  return array.filter(function(x) {
    return x;
  });
};

var buildScope = function(scope) {
  var builtScope = scope.trim();
  return builtScope ? '(' + builtScope + ')' : '';
};

var buildSubjectLine = function(answers, subject = answers.subject) {
  return answers.type + buildScope(answers.scope) + ': ' + subject.trim();
};

var buildIssues = function(issues) {
  return issues.replace(/([A-Z]+-[0-9]+)/, "$1, #$1");
};

// This can be any kind of SystemJS compatible module.
// We use Commonjs here, but ES6 or AMD would do just
// fine.
module.exports = function (options) {
  var types = options.types;
  var typeLength = longest(Object.keys(types)).length + 1;
  var typeChoices = map(types, function (type, key) {
    return {
      name: rightPad(key + ':', typeLength) + ' ' + type.description,
      value: key
    };
  });

  return {
    // When a user runs `git cz`, prompter will
    // be executed. We pass you cz, which currently
    // is just an instance of inquirer.js. Using
    // this you can ask questions and get answers.
    //
    // The commit callback should be executed when
    // you're ready to send back a commit template
    // to git.
    //
    // By default, we'll de-indent your commit
    // template and will keep empty lines.
    prompter: function(cz, commit) {
      console.log('\nThe subject line is limited to 72 characters. All other lines will be wrapped after 100 characters.\n');

      // Let's ask some questions of the user
      // so that we can populate our commit
      // template.
      //
      // See inquirer.js docs for specifics.
      // You can also opt to use another input
      // collection library if you prefer.
      cz.prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Select the type of change that you\'re committing:',
          choices: typeChoices,
          default: options.defaultType
        }, {
          type: options.scopes ? 'list' : 'input',
          name: 'scope',
          message: 'What is the scope of this change (e.g. module or component name)?\n',
          choices: options.scopes ? options.scopes : undefined,
          default: options.defaultScope
        }, {
          type: 'input',
          name: 'subject',
          message: 'Write a short, imperative tense description of the change (max 72 chars with type+scope):\n',
          default: options.defaultSubject,
          validate: function(input, answers) {
            return buildSubjectLine(answers, input).length <= 72;
          }
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
          when: function(answers) {
            return answers.isBreaking;
          }
        }, {
          type: 'confirm',
          name: 'isIssueAffected',
          message: 'Does this change affect any open issues?',
          default: options.defaultIssues ? true : false
        }, {
          type: 'input',
          name: 'issues',
          message: 'Add issue references (e.g. "resolve PROJECT-123", "close PROJECT-123".):\n',
          when: function(answers) {
            return answers.isIssueAffected;
          },
          default: options.defaultIssues ? options.defaultIssues : undefined
        }
      ]).then(function(answers) {
        var maxLineWidth = 100;

        var wrapOptions = {
          trim: true,
          newline: '\n',
          indent: '',
          width: maxLineWidth
        };

        // Build subject line
        var subjectLine = buildSubjectLine(answers);

        // Wrap these lines at 100 characters
        var body = wrap(answers.body, wrapOptions);

        // Apply breaking change prefix, removing it if already present
        var breaking = answers.breaking ? answers.breaking.trim() : '';
        breaking = breaking ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '') : '';
        breaking = wrap(breaking, wrapOptions);

        var issues = answers.issues ? wrap(buildIssues(answers.issues), wrapOptions) : '';

        var footer = filter([ breaking, issues ]).join('\n\n');

        commit(subjectLine + '\n\n' + body + '\n\n' + footer);
      });
    }
  };
};
