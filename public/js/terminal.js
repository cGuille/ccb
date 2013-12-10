jQuery(function () {
    'use strict';

    var exports = window.terminal = {};

    var registeredCommands = {};
    var commandForm = $('#terminal form');
    var commandInput = $('input#command');
    var commandsDatalist = $('#command-list');
    var errorElt = $('#terminal .error');
    var helpElt = $('#terminal .help');
    var commandsHistory = new CommandsHistory();
    var COMMAND_NAME_REGEX = /^\S+$/i;
    var SQUARE_KEYCODE = 192;
    var ESCAPE_KEYCODE = 27;
    var UP_KEYCODE = 38;
    var DOWN_KEYCODE = 40;

    exports.Command = Command;
    exports.register = function register(commands) {
        if (!(commands instanceof Array)) {
            commands = [ commands ];
        }
        commands.forEach(function (command) {
            registerCommand(command);
        });
    };

    $(window).on('keyup', function (event) {
        var onlyAltKey = event.altKey && !event.ctrlKey && !event.shiftKey;
        if (onlyAltKey && event.keyCode === SQUARE_KEYCODE) {
            commandInput.focus();
        }
    });
    commandInput.on('keyup', function (event) {
        var noKeys = !event.altKey && !event.shiftKey && !event.ctrlKey;
        if (event.keyCode === ESCAPE_KEYCODE && noKeys) {
            commandInput.blur();
            terminalError('');
            terminalHelp('');
        } else if (event.keyCode === UP_KEYCODE && noKeys) {
            terminalCommand(commandsHistory.up());
        } else if (event.keyCode === DOWN_KEYCODE && noKeys) {
            terminalCommand(commandsHistory.down());
        }

        commandInput.attr('list', commandInput.val() ? 'command-list' : '');
    });

    commandForm.on('submit', function (event) {
        var command = terminalCommand().trim();

        terminalCommand('');
        terminalError('');
        terminalHelp('');

        if (command) {
            window.setTimeout(function () {
                handle(command);
            }, 0);
        }

        event.preventDefault();
        return false;
    });

    // if (annyang) {
    //     annyang.init({
    //         'command *cmd': function (cmd) {
    //             console.log(cmd);
    //             debugger;
    //             terminalCommand(cmd);
    //             commandForm.submit();
    //         }
    //     });
    //     annyang.start();
    // }

    function handle(commandString) {
        var args = commandString.match(/"[^"]*"|[^\s"]+/g);
        var commandName = args.shift().toLowerCase();
        var command = registeredCommands[commandName];

        commandsHistory.add(commandString);

        if (!command) {
            terminalError('Error: unknown command `' + commandName + '`');
            return;
        }

        window.setTimeout(function () {
            command.process(args);
        }, 0);
    }

    function registerCommand(command, hide) {
        var key = command.name.toLowerCase();
        registeredCommands[key] = command;

        if (hide) {
            return;
        }

        var newOption = $('<option value="' + key + '" />');
        var siblings = commandsDatalist.children();

        if (!siblings.length) {
            newOption.appendTo(commandsDatalist);
        } else {
            var previousSibling = null;
            siblings.each(function (index, sibling) {
                sibling = $(sibling);
                if (key > sibling.val()) {
                    previousSibling = sibling;
                }
            });
            if (!previousSibling) {
                newOption.prependTo(commandsDatalist);
            } else {
                newOption.insertAfter(previousSibling);
            }
        }
    }
    function removeCommand(commandName) {
        var key = commandName.toLowerCase();
        var tmp = registeredCommands[key];

        commandsDatalist.find('option[value="' + key + '"]').remove();

        delete registeredCommands[key];
        return tmp;
    }

    function Command(infos) {
        this.name = infos.name;
        if (!COMMAND_NAME_REGEX.test(this.name)) {
            throw new Error('invalid command name: ' + this.name);
        }
        this.process = infos.processor;
        this.args = infos.args || [];
        this.help = infos.help || 'no help available';
    }
    Command.prototype.command = terminalCommand;
    Command.prototype.error = terminalError;
    Command.prototype.tip = terminalHelp;
    Command.prototype.helpString = function () {
        var argsString = '';
        if (this.args.length) {
            argsString = ' ' + this.args.map(function (arg) {
                return '&lt;' + arg + '&gt;';
            }).join(' ');
        }
        return this.name + argsString + ': ' + this.help;
    };

    function terminalCommand(commandString) {
        if (typeof(commandString) !== 'undefined' && commandString !== null) {
            commandInput.val(commandString);
        }
        return commandInput.val();
    }

    function terminalError(message, textOnly) {
        var method = textOnly ? 'text' : 'html';
        if (typeof(message) !== 'undefined' && message !== null) {
            errorElt[method](message);
        }
        return errorElt[method]();
    }

    function terminalHelp(message, textOnly) {
        var method = textOnly ? 'text' : 'html';
        if (typeof(message) !== 'undefined' && message !== null) {
            helpElt[method](message);
        }
        return helpElt[method]();
    }

    registerCommand(new Command({
        name: 'help',
        processor: function helpBuiltinCommand(args) {
            var commandName = args[0] || '';
            var command = registeredCommands[commandName.toLowerCase()];
            if (!commandName) {
                // terminalHelp('terminal help is required');
                var visibleCommands = commandsDatalist.children().map(function (i, option) {
                    return registeredCommands[$(option).val()];
                });
                var htmlCommandList = $.map(visibleCommands, function (command) {
                    return '<li>' + command.helpString() + '</li>';
                }).join('\n');
                terminalHelp(
                    '<p>command list:</p>\n' +
                    '<ul style="margin-top: 0;">' +
                    htmlCommandList +
                    '</ul>'
                );
            } else if (!command) {
                terminalError('Error: unknown command `' + commandName + '`');
                terminalCommand('help ');
            } else {
                terminalHelp(command.helpString());
                terminalCommand(commandName + ' ');
            }
        },
        args: [ 'command*' ],
        help: 'display the command help (or the command list if no command is given)'
    }));

    registerCommand(new Command({
        name: 'history',
        processor: function historyBuiltinCommand(args) {
            var matchings = commandsHistory.search(args.join(' '));
            var htmlMatchingList = $.map(matchings, function (commandString) {
                return '<li>' + commandString + '</li>';
            }).join('\n');
            var html = (
                '<p>results:</p>\n' +
                '<ul style="margin-top: 0;">' +
                htmlMatchingList +
                '</ul>'
            );
            this.tip(matchings.length ? html : 'no result');
        },
        args: [ 'pattern*' ],
        help: 'display the history entries matching the pattern (the whole history if no pattern is provided)'
    }));

    registerCommand(new Command({
        name: 'konami',
        processor: function () {
            this.tip('<span style="letter-spacing: 10px;">⇑⇑⇓⇓⇐⇒⇐⇒BA</span>');
        },
        'help': 'show the konami code'
    }), true);
    registerCommand(new Command({
        name: '⇑⇑⇓⇓⇐⇒⇐⇒BA',
        processor: function () {
            window.location = 'http://rickrolled.fr';
        },
        'help': 'active the konami code'
    }), true);
});
