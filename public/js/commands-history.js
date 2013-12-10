(function () {
    'use strict';

    window.CommandsHistory = CommandsHistory;

    function CommandsHistory() {
        this.cursor = -1;
        this.history = [];
        this.size = this.DEFAULT_SIZE;
    }

    CommandsHistory.prototype.DEFAULT_SIZE = 50;

    CommandsHistory.prototype.add = function CommandsHistory_add(command) {
        this.history.push(command);
        if (this.history.length > this.size) {
            this.history.shift();
        }
        resetCursor.call(this);
    };

    CommandsHistory.prototype.up = function CommandsHistory_up() {
        // No history, nothing to return
        if (!this.history.length) {
            return '';
        }

        // We go to the next entry only if we are not at the oldest
        // (Because if we are at the oldest entry, we want to stick with it)
        if (this.cursor > 0) {
            --this.cursor;
        }

        return this.history[this.cursor];
    };

    CommandsHistory.prototype.down = function CommandsHistory_down() {
        if (!this.history.length) {
            return '';
        }

        ++this.cursor;

        if (this.cursor > this.history.length) {
            resetCursor.call(this);
        }

        return this.history[this.cursor] || '';
    };

    CommandsHistory.prototype.search = function (string) {
        return this.history.filter(function (commandString) {
            return commandString.search(string) !== -1;
        });
    };

    function resetCursor() {
        this.cursor = this.history.length || -1;
    }
}());
