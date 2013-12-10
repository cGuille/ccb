jQuery(function () {
    'use strict';

    terminal.register([
        new terminal.Command({
            'name': 'alert',
            'processor': function (args) {
                window.alert(args.join(' '));
            },
            'args': ['message'],
            'help': 'raise an alert containing the given message'
        }),
        new terminal.Command({
            'name': 'error',
            'processor': function (args) {
                this.error(args.join(' '));
            },
            'args': ['message'],
            'help': 'show an error with the given message'
        }),
        new terminal.Command({
            'name': 'tip',
            'processor': function (args) {
                this.tip(args.join(' '));
            },
            'args': ['message'],
            'help': 'show a tip with the given message'
        }),
    ]);
});
