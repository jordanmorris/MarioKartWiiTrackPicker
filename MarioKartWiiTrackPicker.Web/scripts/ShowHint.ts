module App {
    'use strict';

    export class ShowHint implements ng.IDirective {

        constructor(
            private $interval: ng.IIntervalService,
            private $cookies: ng.cookies.ICookiesService) { }

        private showHintDelayMs = 6000;
        private cookieKeyVeto = 'shown-hint-veto';
        private showHintRequested: boolean;

        public restrict = 'A';

        public scope = {
            showHint: '='
        };

        public link = ($scope: IShowHintScope, element: JQuery) => {
            if (typeof ($scope.showHint) === 'undefined' || $scope.showHint) {
                element.click(this.showHintIfNotSeenBefore);
            } else {
                element.click(this.hideHint);
            }
            this.showHintRequested = false;
        }

        private showHintIfNotSeenBefore = () => {
            if (this.showHintRequested) return;
            this.showHintRequested = true;

            var dismissedPreviously = this.$cookies.getObject(this.cookieKeyVeto);
            if (dismissedPreviously) return;

            this.$interval(() => {
                $('.hint').addClass('hint-show');
            }, this.showHintDelayMs, 1);
        };

        private hideHint = () => {
            $('.hint').removeClass('hint-show');

            var expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 100); 
            var cookieOptions = {
                expires: expiryDate,
                secure: true
            };
            this.$cookies.putObject(this.cookieKeyVeto, true, cookieOptions);
        };
    }

    interface IShowHintScope extends angular.IScope {
        showHint: boolean
    }

    var factory: ng.IDirectiveFactory =
        ($interval: ng.IIntervalService, $cookies: ng.cookies.ICookiesService) =>
            new ShowHint($interval, $cookies);

    factory.$inject = ['$interval', '$cookies'];

    angular.module('App').directive('showHint', factory);
}